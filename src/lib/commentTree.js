// Builds a nested reply tree from a flat list of comment rows. Works
// regardless of fetch order since every node is indexed before any
// parent/child links are attached.
export function buildCommentTree(comments) {
  const nodesById = new Map()

  comments.forEach((comment) => {
    nodesById.set(comment.id, { ...comment, children: [] })
  })

  const roots = []

  nodesById.forEach((node) => {
    const parent = node.parent_id ? nodesById.get(node.parent_id) : null
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const byCreatedAtAsc = (a, b) => new Date(a.created_at) - new Date(b.created_at)

  function sortRecursively(nodes) {
    nodes.sort(byCreatedAtAsc)
    nodes.forEach((node) => sortRecursively(node.children))
  }

  sortRecursively(roots)

  return roots
}
