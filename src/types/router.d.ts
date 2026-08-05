import 'vue-router'

declare module 'vue-router' {
  // 路由 meta 是工作台页面头与占位页的渲染数据源，集中声明类型后
  // 视图里读取 meta 不再需要逐个 as string 断言。
  interface RouteMeta {
    /** 页面标题，同时用于 document.title */
    title?: string
    /** 页面头副标题 */
    description?: string
    /** 当前路由在工作区主导航中的归属 */
    navKey?: 'dashboard' | 'projects' | 'parse-records' | 'profile'
    /** 免鉴权页面 */
    public?: boolean
    /**
     * 面包屑导航路径，按「工作台 / 父级 / 当前页」顺序排列；
     * 最后一项为当前页（不可点击），前面的项带 name 用于跳转。
     * 仅在层级 >= 2 的二级页面配置，顶级页面由顶栏标题即可定位。
     */
    breadcrumb?: Array<{ label: string; name?: string }>
    /** 占位页：本页待完成的目标 */
    suggestedActions?: string[]
    /** 占位页：待接入的后端接口 */
    endpointGroups?: string[]
  }
}
