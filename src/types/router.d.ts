import 'vue-router'

declare module 'vue-router' {
  // 路由 meta 是工作台页面头与占位页的渲染数据源，集中声明类型后
  // 视图里读取 meta 不再需要逐个 as string 断言。
  interface RouteMeta {
    /** 页面标题，同时用于 document.title */
    title?: string
    /** 页面头副标题 */
    description?: string
    /** 页面头右侧状态标签 */
    statusLabel?: string
    /** 免鉴权页面 */
    public?: boolean
    /** 占位页：本页待完成的目标 */
    suggestedActions?: string[]
    /** 占位页：待接入的后端接口 */
    endpointGroups?: string[]
  }
}
