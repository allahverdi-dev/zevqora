interface OverflowSnapshot {
  readonly style: CSSStyleDeclaration
  readonly overflow: string
  readonly priority: string
  readonly x: string
  readonly y: string
  readonly xPriority: string
  readonly yPriority: string
}

interface ScrollLock {
  count: number
  readonly previous: OverflowSnapshot[]
}

const locks = new WeakMap<Document, ScrollLock>()

/** Lock the viewport as well as the body; release only the caller's lock. */
export function lockDocumentScroll(doc: Document = document): () => void {
  let lock = locks.get(doc)
  if (!lock) {
    const previous = [doc.documentElement, doc.body].map(({ style }) => ({
      style,
      overflow: style.getPropertyValue('overflow'),
      priority: style.getPropertyPriority('overflow'),
      x: style.getPropertyValue('overflow-x'),
      y: style.getPropertyValue('overflow-y'),
      xPriority: style.getPropertyPriority('overflow-x'),
      yPriority: style.getPropertyPriority('overflow-y'),
    }))
    lock = { count: 0, previous }
    locks.set(doc, lock)
    for (const { style } of previous) style.setProperty('overflow', 'hidden')
  }
  lock.count++

  let released = false
  return () => {
    if (released) return
    released = true
    if (--lock.count > 0) return

    for (const { style, overflow, priority, x, y, xPriority, yPriority } of lock.previous) {
      style.removeProperty('overflow')
      if (overflow) style.setProperty('overflow', overflow, priority)
      if (x) style.setProperty('overflow-x', x, xPriority)
      if (y) style.setProperty('overflow-y', y, yPriority)
    }
    locks.delete(doc)
  }
}
