import { FlowNodeType, FlowEdgeType, SourceLocation } from './FlowTypes';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  source?: SourceLocation;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: FlowEdgeType;
  label?: string;
  metadata?: Record<string, any>;
}

export class FlowGraph {
  private nodes: Map<string, FlowNode> = new Map();
  private edges: Map<string, FlowEdge> = new Map();

  public addNode(node: FlowNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with id ${node.id} already exists`);
    }
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: FlowEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with id ${edge.id} already exists`);
    }
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node ${edge.source} does not exist`);
    }
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node ${edge.target} does not exist`);
    }
    this.edges.set(edge.id, edge);
  }

  public getNodes(): FlowNode[] {
    return Array.from(this.nodes.values());
  }

  public getEdges(): FlowEdge[] {
    return Array.from(this.edges.values());
  }

  public getNode(id: string): FlowNode | undefined {
    return this.nodes.get(id);
  }

  public validateTopology(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodes = this.getNodes();
    const edges = this.getEdges();

    const startNodes = nodes.filter(n => n.type === 'start');
    if (startNodes.length === 0) errors.push('Missing START node');
    if (startNodes.length > 1) errors.push(`Multiple START nodes found (${startNodes.length})`);

    const endNodes = nodes.filter(n => n.type === 'end');
    if (endNodes.length === 0) errors.push('Missing END node');

    const incomingEdges = new Map<string, number>();
    const outgoingEdges = new Map<string, number>();

    nodes.forEach(n => {
      incomingEdges.set(n.id, 0);
      outgoingEdges.set(n.id, 0);
    });

    edges.forEach(e => {
      if (!this.nodes.has(e.source)) errors.push(`Edge references missing source node: ${e.source}`);
      if (!this.nodes.has(e.target)) errors.push(`Edge references missing target node: ${e.target}`);
      
      incomingEdges.set(e.target, (incomingEdges.get(e.target) || 0) + 1);
      outgoingEdges.set(e.source, (outgoingEdges.get(e.source) || 0) + 1);
    });

    nodes.forEach(n => {
      const isStart = n.type === 'start';
      const isEnd = n.type === 'end';
      const inCount = incomingEdges.get(n.id) || 0;
      const outCount = outgoingEdges.get(n.id) || 0;

      if (!isStart && inCount === 0) {
        errors.push(`Orphan node detected (unreachable): ${n.id} (${n.label})`);
      }
      if (!isEnd && outCount === 0) {
        errors.push(`Node terminates unexpectedly (missing connection to END): ${n.id} (${n.label})`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}
