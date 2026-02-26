export type EmbedResizeMessage = {
  type: "sf-booking-embed-resize"
  height: number
}

function getDocumentHeight() {
  if (typeof document === "undefined") return 0
  const body = document.body
  const html = document.documentElement
  return Math.max(
    body?.scrollHeight || 0,
    body?.offsetHeight || 0,
    html?.clientHeight || 0,
    html?.scrollHeight || 0,
    html?.offsetHeight || 0
  )
}

export function startEmbedAutoResize() {
  if (typeof window === "undefined" || window.parent === window) {
    return () => {}
  }

  let frame: number | null = null
  const postHeight = () => {
    if (frame !== null) return
    frame = window.requestAnimationFrame(() => {
      frame = null
      const payload: EmbedResizeMessage = {
        type: "sf-booking-embed-resize",
        height: getDocumentHeight(),
      }
      window.parent.postMessage(payload, "*")
    })
  }

  postHeight()
  window.addEventListener("resize", postHeight)
  window.addEventListener("load", postHeight)

  const observer =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          postHeight()
        })
      : null

  if (observer) {
    if (document.body) observer.observe(document.body)
    if (document.documentElement) observer.observe(document.documentElement)
  }

  const interval = window.setInterval(postHeight, 1000)

  return () => {
    if (frame !== null) {
      window.cancelAnimationFrame(frame)
    }
    window.removeEventListener("resize", postHeight)
    window.removeEventListener("load", postHeight)
    window.clearInterval(interval)
    observer?.disconnect()
  }
}
