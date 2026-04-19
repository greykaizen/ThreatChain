# /// script
# dependencies = [
#   "networkx",
#   "python-louvain",
# ]
# ///

import sys
import json
import networkx as nx
from community import community_louvain

def cluster_data(json_input):
    try:
        data = json.loads(json_input)
    except Exception as e:
        return json.dumps({"error": f"Invalid JSON input: {str(e)}", "nodes": [], "links": []})

    nodes = data.get('nodes', [])
    links = data.get('links', [])
    
    if not nodes:
        return json.dumps({"nodes": [], "links": []})

    # 1. Build NetworkX Graph
    G = nx.Graph()
    for node in nodes:
        G.add_node(node['id'], **node)
    
    for link in links:
        source = link.get('source')
        target = link.get('target')
        if source in G and target in G:
            G.add_edge(source, target, weight=link.get('value', 1))

    # 2. Run Louvain Community Detection (The "Real" Graphify Brain)
    try:
        if G.number_of_edges() > 0:
            partition = community_louvain.best_partition(G)
        else:
            # Fallback for disconnected nodes
            partition = {node['id']: i % 10 for i, node in enumerate(nodes)}
    except Exception as e:
        # Fallback if algo fails
        partition = {node['id']: 0 for node in nodes}

    # 3. Update nodes with community IDs
    for node in nodes:
        node['community'] = partition.get(node['id'], 0)
        node['degree'] = G.degree(node['id']) if node['id'] in G else 0

    return json.dumps({"nodes": nodes, "links": links})

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
             print(json.dumps({"nodes": [], "links": []}))
        else:
             print(cluster_data(input_data))
    except Exception as e:
        print(json.dumps({"error": str(e), "nodes": [], "links": []}))
