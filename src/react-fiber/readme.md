Scheduler（调度器）： 排序优先级，让优先级高的任务先进行reconcile

Reconciler（协调器）： 找出哪些节点发生了改变，并打上不同的Tag，发生在render阶段，render阶段会分别为节点执行beginWork和completeWork（后面会讲），或者计算state，对比节点的差异，为节点赋值相应的effectTag（对应dom节点的增删改）

Renderer（渲染器）： 将Reconciler中打好标签的节点渲染到视图上，发生在commit阶段，commit阶段遍历effectList执行对应的dom操作或部分生命周期

本demo未实现任务优先级 任务调度和expirationTime过期时间 
未实现reconciler过程中的diff优化