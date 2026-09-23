import { FlowGraph, FlowNode, FlowEdge } from '../../domain/FlowGraph';
import { FlowNodeType, FlowEdgeType } from '../../domain/FlowTypes';
import { ParseResult } from '../../types';

export class LegacyAdapter {
  /**
   * Adapts the legacy ParseResult (which outputs Mermaid + simple AST nodes) 
   * into the new agnostic FlowGraph domain model.
   */
  public static adapt(legacyResult: ParseResult): FlowGraph {
    const graph = new FlowGraph();

    for (const legacyNode of legacyResult.nodes) {
      const node: FlowNode = {
        id: legacyNode.id,
        type: this.mapNodeType(legacyNode.type),
        label: legacyNode.label,
        metadata: { legacyDetails: legacyNode.details }
      };
      graph.addNode(node);
    }

    let edgeCounter = 0;
    for (const legacyEdge of legacyResult.edges) {
      try {
        const edge: FlowEdge = {
          id: `edge_${edgeCounter++}`,
          source: legacyEdge.from,
          target: legacyEdge.to,
          type: this.mapEdgeType(legacyEdge.label),
          label: legacyEdge.label
        };
        graph.addEdge(edge);
      } catch (e) {
        // Skip invalid legacy edges gracefully (since legacy doesn't guarantee strict integrity)
      }
    }

    return graph;
  }

  private static mapNodeType(legacyType: string): FlowNodeType {
    switch (legacyType) {
      case 'start': return 'start';
      case 'end': return 'end';
      case 'decision': return 'decision';
      case 'loop': return 'loop';
      case 'io': return 'io';
      case 'process': 
      case 'call': return 'process';
      default: return 'process';
    }
  }

  private static mapEdgeType(label?: string): FlowEdgeType {
    if (!label) return 'default';
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === 'true' || lowerLabel === 'yes') return 'true';
    if (lowerLabel === 'false' || lowerLabel === 'no') return 'false';
    return 'default';
  }
}
