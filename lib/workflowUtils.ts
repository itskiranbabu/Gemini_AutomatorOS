
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

// Get all nodes that are strictly upstream of the target node
export const getUpstreamNodes = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  targetNodeId: string
): WorkflowNode[] => {
  const upstream = new Set<string>();
  const queue = [targetNodeId];
  const visited = new Set<string>();

  // Reverse traversal from target to find ancestors
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Find edges pointing TO currentId
    const incomingEdges = edges.filter(e => e.target === currentId);
    
    for (const edge of incomingEdges) {
       if (!upstream.has(edge.source)) {
           upstream.add(edge.source);
           queue.push(edge.source);
       }
    }
  }

  return nodes.filter(n => upstream.has(n.id));
};

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Detect cycles using DFS
const hasCycle = (nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean => {
    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
        if (adj.has(e.source)) adj.get(e.source)?.push(e.target);
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
        if (recStack.has(nodeId)) return true; // Cycle detected
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (dfs(neighbor)) return true;
        }

        recStack.delete(nodeId);
        return false;
    };

    for (const node of nodes) {
        if (dfs(node.id)) return true;
    }
    return false;
};

export const validateWorkflow = (nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult => {
    const errors: string[] = [];

    // 1. Check for Triggers
    const triggers = nodes.filter(n => n.type === NodeType.TRIGGER);
    if (triggers.length === 0) {
        errors.push("Workflow must have at least one Trigger node.");
    }

    // 2. Check for Disconnected Nodes (Orphans)
    // Every node except Triggers must have at least one incoming edge
    const nonTriggers = nodes.filter(n => n.type !== NodeType.TRIGGER);
    nonTriggers.forEach(node => {
        const hasIncoming = edges.some(e => e.target === node.id);
        if (!hasIncoming) {
            errors.push(`Node '${node.label}' is disconnected (no incoming connection).`);
        }
    });

    // 3. Cycle Detection
    if (hasCycle(nodes, edges)) {
        errors.push("Workflow contains an infinite loop (cycle). Please remove the cycle.");
    }
    
    // 4. Basic Config Validation
    nodes.forEach(node => {
        if (!node.service) errors.push(`Node '${node.label}' is missing a service definition.`);
        
        // Specific checks
        if (node.type === NodeType.CONDITION) {
             // Conditions usually need edges coming out
             const outgoing = edges.filter(e => e.source === node.id);
             if (outgoing.length === 0) {
                 errors.push(`Condition '${node.label}' has no outgoing paths.`);
             }
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};
