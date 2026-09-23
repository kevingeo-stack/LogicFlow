import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeTimestamp, formatDisplayDate } from '../../utils/timeUtils';
import { Diagram } from '../../types';

describe('Time Utilities (normalizeTimestamp)', () => {
  it('handles ISO strings correctly', () => {
    const iso = '2026-09-22T18:41:09.000Z';
    const num = normalizeTimestamp(iso);
    expect(num).toBe(new Date(iso).getTime());
  });

  it('handles legacy strings correctly', () => {
    const legacy = 'Oct 24, 2024 · 14:32';
    // By stripping the dot, it parses like Oct 24, 2024 14:32
    const num = normalizeTimestamp(legacy);
    expect(num).toBe(new Date('Oct 24, 2024 14:32').getTime());
  });

  it('handles epoch numbers correctly', () => {
    const epoch = 1700000000000;
    const num = normalizeTimestamp(epoch);
    expect(num).toBe(epoch);
  });

  it('handles invalid timestamps safely', () => {
    expect(normalizeTimestamp('invalid date')).toBe(0);
    expect(normalizeTimestamp(null)).toBe(0);
    expect(normalizeTimestamp(undefined)).toBe(0);
    expect(normalizeTimestamp('')).toBe(0);
  });

  it('formats display date correctly', () => {
    const iso = '2024-10-24T14:32:00.000Z';
    // Result depends on timezone, but let's check it doesn't crash and returns a string
    const formatted = formatDisplayDate(iso);
    expect(formatted).toContain('Oct 24, 2024');
    expect(formatted).toContain('·');
  });
});

describe('LWW Sync Logic (Simulated)', () => {
  const createMockDiagram = (id: string, updatedAt: string, isDeleted = false): Diagram => ({
    id,
    title: 'Test',
    filename: 'test.py',
    language: 'python',
    sourceCode: 'print("test")',
    mermaidSyntax: '',
    complexity: 'O(1)',
    statusBadge: 'STABLE',
    nodeCount: 1,
    edgeCount: 0,
    category: 'Test',
    pipelineNodes: [],
    createdAt: updatedAt,
    updatedAt,
    isDeleted,
  });

  // Pure function simulation of syncBidirectional's LWW algorithm
  const simulateLWW = (localMap: Map<string, Diagram>, remoteMap: Map<string, Diagram>) => {
    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
    const actions: { action: 'push' | 'pull' | 'none', diagram: Diagram }[] = [];

    for (const id of allIds) {
      const local = localMap.get(id);
      const remote = remoteMap.get(id);

      if (local && !remote) {
        actions.push({ action: 'push', diagram: local });
      } else if (!local && remote) {
        actions.push({ action: 'pull', diagram: remote });
      } else if (local && remote) {
        const localTime = normalizeTimestamp(local.updatedAt);
        const remoteTime = normalizeTimestamp(remote.updatedAt);

        if (localTime > remoteTime) {
          actions.push({ action: 'push', diagram: local });
        } else if (remoteTime > localTime) {
          actions.push({ action: 'pull', diagram: remote });
        } else {
          actions.push({ action: 'none', diagram: local });
        }
      }
    }
    return actions;
  };

  it('pushes local-only diagram to cloud', () => {
    const local = createMockDiagram('A', '2024-01-01T12:00:00Z');
    const localMap = new Map([['A', local]]);
    const remoteMap = new Map();
    const actions = simulateLWW(localMap, remoteMap);
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('push');
    expect(actions[0].diagram.id).toBe('A');
  });

  it('pulls remote-only diagram to local', () => {
    const remote = createMockDiagram('B', '2024-01-01T12:00:00Z');
    const localMap = new Map();
    const remoteMap = new Map([['B', remote]]);
    const actions = simulateLWW(localMap, remoteMap);
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('pull');
    expect(actions[0].diagram.id).toBe('B');
  });

  it('keeps local when local is newer (LWW)', () => {
    const local = createMockDiagram('C', '2024-01-02T12:00:00Z');
    const remote = createMockDiagram('C', '2024-01-01T12:00:00Z');
    const actions = simulateLWW(new Map([['C', local]]), new Map([['C', remote]]));
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('push');
    expect(actions[0].diagram.id).toBe('C');
  });

  it('pulls remote when remote is newer (LWW)', () => {
    const local = createMockDiagram('D', '2024-01-01T12:00:00Z');
    const remote = createMockDiagram('D', '2024-01-02T12:00:00Z');
    const actions = simulateLWW(new Map([['D', local]]), new Map([['D', remote]]));
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('pull');
    expect(actions[0].diagram.id).toBe('D');
  });

  it('does nothing when timestamps are equal', () => {
    const local = createMockDiagram('E', '2024-01-01T12:00:00Z');
    const remote = createMockDiagram('E', '2024-01-01T12:00:00Z');
    const actions = simulateLWW(new Map([['E', local]]), new Map([['E', remote]]));
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('none');
  });

  it('tombstone local wins if newer, pushing delete state to cloud', () => {
    const localTombstone = createMockDiagram('F', '2024-01-02T12:00:00Z', true);
    const remoteAlive = createMockDiagram('F', '2024-01-01T12:00:00Z', false);
    const actions = simulateLWW(new Map([['F', localTombstone]]), new Map([['F', remoteAlive]]));
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('push'); // Pushing the tombstone overwrites the remote
    expect(actions[0].diagram.isDeleted).toBe(true);
  });

  it('remote tombstone wins if newer, pulling delete state to local', () => {
    const localAlive = createMockDiagram('G', '2024-01-01T12:00:00Z', false);
    const remoteTombstone = createMockDiagram('G', '2024-01-02T12:00:00Z', true);
    const actions = simulateLWW(new Map([['G', localAlive]]), new Map([['G', remoteTombstone]]));
    
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('pull'); // Pulling the tombstone overwrites local
    expect(actions[0].diagram.isDeleted).toBe(true);
  });

  it('multiple projects resolve independently', () => {
    const local = new Map([
      ['H', createMockDiagram('H', '2024-01-01T12:00:00Z')], // older
      ['I', createMockDiagram('I', '2024-01-02T12:00:00Z')]  // newer
    ]);
    const remote = new Map([
      ['H', createMockDiagram('H', '2024-01-02T12:00:00Z')], // newer
      ['I', createMockDiagram('I', '2024-01-01T12:00:00Z')]  // older
    ]);

    const actions = simulateLWW(local, remote);
    const hAction = actions.find(a => a.diagram.id === 'H');
    const iAction = actions.find(a => a.diagram.id === 'I');

    expect(hAction?.action).toBe('pull');
    expect(iAction?.action).toBe('push');
  });
});
