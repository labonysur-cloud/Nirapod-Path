import { BuildingData, RouteResult, RouteCandidate, ValidationResult } from '../types/simulator';

interface GraphEdge {
  id: string;
  target: string;
  cost: number;
}

export function validateBuildingData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be a valid JSON object.'] };
  }

  const obj = data as Partial<BuildingData>;

  // Check building name
  if (typeof obj.building !== 'string' || obj.building.trim().length === 0) {
    errors.push('Field "building" must be a non-empty string.');
  }

  // Check nodes array
  if (!Array.isArray(obj.nodes)) {
    errors.push('Field "nodes" must be an array.');
  } else {
    if (obj.nodes.length < 2 || obj.nodes.length > 60) {
      errors.push(`Node count must be between 2 and 60 (found ${obj.nodes.length}).`);
    }

    const seenNodeIds = new Set<string>();
    let hasRoomOrJunction = false;
    let hasExit = false;

    for (let i = 0; i < obj.nodes.length; i++) {
      const node = obj.nodes[i];
      if (!node || typeof node !== 'object') {
        errors.push(`Node at index ${i} is not a valid object.`);
        continue;
      }
      if (typeof node.id !== 'string' || node.id.trim().length === 0) {
        errors.push(`Node at index ${i} has invalid or missing "id".`);
      } else {
        if (seenNodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: "${node.id}".`);
        }
        seenNodeIds.add(node.id);
      }

      if (typeof node.label !== 'string' || node.label.trim().length === 0) {
        errors.push(`Node "${node.id || i}" has invalid or missing "label".`);
      }

      if (node.type !== 'room' && node.type !== 'junction' && node.type !== 'exit') {
        errors.push(`Node "${node.id || i}" has invalid type "${node.type}". Must be "room", "junction", or "exit".`);
      } else {
        if (node.type === 'room' || node.type === 'junction') hasRoomOrJunction = true;
        if (node.type === 'exit') hasExit = true;
      }

      if (typeof node.x !== 'number' || isNaN(node.x) || typeof node.y !== 'number' || isNaN(node.y)) {
        errors.push(`Node "${node.id || i}" must have numeric x and y coordinates.`);
      }
    }

    if (!hasRoomOrJunction) {
      errors.push('Graph must contain at least one "room" or "junction".');
    }
    if (!hasExit) {
      errors.push('Graph must contain at least one "exit".');
    }

    // Check edges
    if (!Array.isArray(obj.edges)) {
      errors.push('Field "edges" must be an array.');
    } else {
      if (obj.edges.length < 1 || obj.edges.length > 150) {
        errors.push(`Edge count must be between 1 and 150 (found ${obj.edges.length}).`);
      }

      const seenEdgeIds = new Set<string>();
      const seenPairs = new Set<string>();

      for (let i = 0; i < obj.edges.length; i++) {
        const edge = obj.edges[i];
        if (!edge || typeof edge !== 'object') {
          errors.push(`Edge at index ${i} is not a valid object.`);
          continue;
        }

        if (typeof edge.id !== 'string' || edge.id.trim().length === 0) {
          errors.push(`Edge at index ${i} has invalid or missing "id".`);
        } else {
          if (seenEdgeIds.has(edge.id)) {
            errors.push(`Duplicate edge ID: "${edge.id}".`);
          }
          seenEdgeIds.add(edge.id);
        }

        if (!seenNodeIds.has(edge.from)) {
          errors.push(`Edge "${edge.id || i}" references nonexistent "from" node: "${edge.from}".`);
        }
        if (!seenNodeIds.has(edge.to)) {
          errors.push(`Edge "${edge.id || i}" references nonexistent "to" node: "${edge.to}".`);
        }

        // Self loop check
        if (edge.from && edge.to && edge.from === edge.to) {
          errors.push(`Self-loop detected on edge "${edge.id || i}" (from "${edge.from}" to "${edge.to}").`);
        }

        // Repeated undirected pair check
        if (edge.from && edge.to && edge.from !== edge.to) {
          const pairKey = edge.from < edge.to ? `${edge.from}---${edge.to}` : `${edge.to}---${edge.from}`;
          if (seenPairs.has(pairKey)) {
            errors.push(`Repeated edge connection between "${edge.from}" and "${edge.to}".`);
          }
          seenPairs.add(pairKey);
        }

        // Cost positive integer check
        if (typeof edge.cost !== 'number' || !Number.isInteger(edge.cost) || edge.cost <= 0) {
          errors.push(`Edge "${edge.id || i}" must have a positive integer cost (found ${edge.cost}).`);
        }
      }

      // Check initial_state
      if (!obj.initial_state || typeof obj.initial_state !== 'object') {
        errors.push('Field "initial_state" must be an object.');
      } else {
        const { blocked_nodes, blocked_edges, closed_exits } = obj.initial_state;

        if (!Array.isArray(blocked_nodes)) {
          errors.push('"initial_state.blocked_nodes" must be an array.');
        } else {
          for (const nid of blocked_nodes) {
            const foundNode = obj.nodes.find(n => n.id === nid);
            if (!foundNode) {
              errors.push(`Initial blocked node "${nid}" does not exist in nodes list.`);
            } else if (foundNode.type === 'exit') {
              errors.push(`Initial blocked node "${nid}" is an exit. Exits belong in closed_exits.`);
            }
          }
        }

        if (!Array.isArray(blocked_edges)) {
          errors.push('"initial_state.blocked_edges" must be an array.');
        } else {
          for (const eid of blocked_edges) {
            const foundEdge = obj.edges.find(e => e.id === eid);
            if (!foundEdge) {
              errors.push(`Initial blocked edge "${eid}" does not exist in edges list.`);
            }
          }
        }

        if (!Array.isArray(closed_exits)) {
          errors.push('"initial_state.closed_exits" must be an array.');
        } else {
          for (const xid of closed_exits) {
            const foundNode = obj.nodes.find(n => n.id === xid);
            if (!foundNode) {
              errors.push(`Initial closed exit "${xid}" does not exist in nodes list.`);
            } else if (foundNode.type !== 'exit') {
              errors.push(`Initial closed exit "${xid}" is of type "${foundNode.type}", not "exit".`);
            }
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: obj as BuildingData };
}

/**
 * Compare two node sequences lexicographically element-by-element.
 * Returns negative if seqA < seqB, positive if seqA > seqB, 0 if identical.
 */
function compareNodeSequences(seqA: string[], seqB: string[]): number {
  const minLen = Math.min(seqA.length, seqB.length);
  for (let i = 0; i < minLen; i++) {
    const cmp = seqA[i].localeCompare(seqB[i]);
    if (cmp !== 0) return cmp;
  }
  return seqA.length - seqB.length;
}

/**
 * Computes the lowest-cost evacuation route from startNodeId to an open exit.
 * Follows exact problem statement tie-breaking rules:
 * 1. Minimum sum of edge costs.
 * 2. On equal cost: lexicographically smallest exit ID.
 * 3. On paths to that exit tying in cost: lexicographically smallest node ID sequence.
 */
export function calculateEvacuationRoute(
  buildingData: BuildingData,
  startNodeId: string | null,
  activeBlockedNodes: Set<string>,
  activeBlockedEdges: Set<string>,
  activeClosedExits: Set<string>
): RouteResult {
  if (!startNodeId) {
    return {
      status: 'no_route',
      pathNodes: [],
      pathEdges: [],
      exitId: null,
      totalCost: 0,
    };
  }

  // Check if start location is blocked
  if (activeBlockedNodes.has(startNodeId)) {
    return {
      status: 'start_blocked',
      pathNodes: [],
      pathEdges: [],
      exitId: null,
      totalCost: 0,
      message: 'Starting location blocked',
    };
  }

  const nodeMap = new Map(buildingData.nodes.map(n => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  if (!startNode) {
    return {
      status: 'no_route',
      pathNodes: [],
      pathEdges: [],
      exitId: null,
      totalCost: 0,
      message: 'No route available',
    };
  }

  // Build adjacency list for unblocked edges and nodes
  const adj = new Map<string, GraphEdge[]>();
  for (const n of buildingData.nodes) {
    adj.set(n.id, []);
  }

  for (const edge of buildingData.edges) {
    if (activeBlockedEdges.has(edge.id)) continue;
    if (activeBlockedNodes.has(edge.from) || activeBlockedNodes.has(edge.to)) continue;
    if (activeClosedExits.has(edge.from) || activeClosedExits.has(edge.to)) continue;

    adj.get(edge.from)?.push({ id: edge.id, target: edge.to, cost: edge.cost });
    adj.get(edge.to)?.push({ id: edge.id, target: edge.from, cost: edge.cost });
  }

  // Identify all valid, open exits
  const openExitIds = buildingData.nodes
    .filter(n => n.type === 'exit' && !activeClosedExits.has(n.id) && !activeBlockedNodes.has(n.id))
    .map(n => n.id);

  if (openExitIds.length === 0) {
    return {
      status: 'no_route',
      pathNodes: [],
      pathEdges: [],
      exitId: null,
      totalCost: 0,
      message: 'No route available',
    };
  }

  // Priority Queue / Dijkstra state tracking
  // To handle tie breaking and alternative routes:
  // We can track the best cost to each node, but since we need exact sequence tie-breaking,
  // we record the optimal path(s) to each reachable node.
  interface State {
    cost: number;
    node: string;
    pathNodes: string[];
    pathEdges: string[];
  }

  // Best known paths to all nodes: Map<nodeId, { cost: number, pathNodes: string[], pathEdges: string[] }>
  const bestToNode = new Map<string, { cost: number; pathNodes: string[]; pathEdges: string[] }>();
  bestToNode.set(startNodeId, { cost: 0, pathNodes: [startNodeId], pathEdges: [] });

  const queue: State[] = [
    { cost: 0, node: startNodeId, pathNodes: [startNodeId], pathEdges: [] },
  ];

  const exitCandidates: RouteCandidate[] = [];

  while (queue.length > 0) {
    // Pick smallest cost, with tie break on sequence
    let bestIndex = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].cost < queue[bestIndex].cost) {
        bestIndex = i;
      } else if (queue[i].cost === queue[bestIndex].cost) {
        if (compareNodeSequences(queue[i].pathNodes, queue[bestIndex].pathNodes) < 0) {
          bestIndex = i;
        }
      }
    }

    const current = queue.splice(bestIndex, 1)[0];
    const currentNodeObj = nodeMap.get(current.node);

    // If current is an open exit, record candidate and do not expand further (exits are route endpoints)
    if (currentNodeObj?.type === 'exit') {
      exitCandidates.push({
        pathNodes: current.pathNodes,
        pathEdges: current.pathEdges,
        exitId: current.node,
        totalCost: current.cost,
      });
      continue;
    }

    // Expand neighbors
    const neighbors = adj.get(current.node) || [];
    for (const edge of neighbors) {
      // Do not revisit nodes already in path (prevents cycles)
      if (current.pathNodes.includes(edge.target)) continue;

      const newCost = current.cost + edge.cost;
      const newPathNodes = [...current.pathNodes, edge.target];
      const newPathEdges = [...current.pathEdges, edge.id];

      const existingBest = bestToNode.get(edge.target);

      let shouldUpdate = false;
      if (!existingBest || newCost < existingBest.cost) {
        shouldUpdate = true;
      } else if (newCost === existingBest.cost) {
        if (compareNodeSequences(newPathNodes, existingBest.pathNodes) < 0) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        bestToNode.set(edge.target, { cost: newCost, pathNodes: newPathNodes, pathEdges: newPathEdges });
        queue.push({
          cost: newCost,
          node: edge.target,
          pathNodes: newPathNodes,
          pathEdges: newPathEdges,
        });
      }
    }
  }

  if (exitCandidates.length === 0) {
    return {
      status: 'no_route',
      pathNodes: [],
      pathEdges: [],
      exitId: null,
      totalCost: 0,
      message: 'No route available',
    };
  }

  // Sort candidates by:
  // 1. totalCost ascending
  // 2. exitId lexicographically ascending
  // 3. pathNodes sequence lexicographically ascending
  exitCandidates.sort((a, b) => {
    if (a.totalCost !== b.totalCost) {
      return a.totalCost - b.totalCost;
    }
    const exitCmp = a.exitId.localeCompare(b.exitId);
    if (exitCmp !== 0) return exitCmp;
    return compareNodeSequences(a.pathNodes, b.pathNodes);
  });

  const winner = exitCandidates[0];

  // Build step details for animated walkthrough & inspector
  const stepDetails = [];
  let cumulative = 0;
  for (let i = 0; i < winner.pathEdges.length; i++) {
    const edgeId = winner.pathEdges[i];
    const fromNode = winner.pathNodes[i];
    const toNode = winner.pathNodes[i + 1];
    const edgeObj = buildingData.edges.find(e => e.id === edgeId);
    const edgeCost = edgeObj ? edgeObj.cost : 0;
    cumulative += edgeCost;
    stepDetails.push({
      from: fromNode,
      to: toNode,
      edgeId,
      cost: edgeCost,
      cumulativeCost: cumulative,
    });
  }

  return {
    status: 'success',
    pathNodes: winner.pathNodes,
    pathEdges: winner.pathEdges,
    exitId: winner.exitId,
    totalCost: winner.totalCost,
    stepDetails,
  };
}

/**
 * Calculates alternative routes to distinct exits or alternative paths.
 */
export function calculateAlternativeRoutes(
  buildingData: BuildingData,
  startNodeId: string | null,
  activeBlockedNodes: Set<string>,
  activeBlockedEdges: Set<string>,
  activeClosedExits: Set<string>,
  primaryExitId: string | null
): RouteCandidate[] {
  if (!startNodeId || !primaryExitId) return [];

  const alternatives: RouteCandidate[] = [];
  const openExitIds = buildingData.nodes
    .filter(n => n.type === 'exit' && !activeClosedExits.has(n.id) && !activeBlockedNodes.has(n.id) && n.id !== primaryExitId)
    .map(n => n.id);

  for (const exitId of openExitIds) {
    // Force destination to this specific exit by temporarily closing all other exits
    const customClosed = new Set(activeClosedExits);
    for (const otherExit of buildingData.nodes.filter(n => n.type === 'exit')) {
      if (otherExit.id !== exitId) customClosed.add(otherExit.id);
    }
    const res = calculateEvacuationRoute(
      buildingData,
      startNodeId,
      activeBlockedNodes,
      activeBlockedEdges,
      customClosed
    );
    if (res.status === 'success' && res.exitId === exitId) {
      alternatives.push({
        exitId,
        pathNodes: res.pathNodes,
        pathEdges: res.pathEdges,
        totalCost: res.totalCost,
      });
    }
  }

  return alternatives.sort((a, b) => a.totalCost - b.totalCost);
}
