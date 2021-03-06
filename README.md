# 元年 P1 VSCode 插件文档

元年 P1 VSCode 插件用于辅助开发人员更快的使用元年 P1 平台开发的组件和工具类。

## 安装地址

https://marketplace.visualstudio.com/items?itemName=yuanian.yn-p1

## 特点

插件中，组件对应的标签名称，属性名称，和属性值都有提示。开发人员会大幅提升开发效率。

## 已完成功能列表

- 对所有按照元年组件标准开发的组件都会有提示。
- 提示元年组件标签名称
- 提示元年组件属性名称
- 提示元年组件事件名称
- 提示元年组件属性值
- 自动 import 组件。不需要再单独导入组件，当在 html 中添加组件标签的同时，会自动添加组件的 import 语句。
- 项目列表界面右键中有创建元年标准组件按钮

## 使用

### 组件提示使用方法

![Usage Sample](/images/usage_sample.gif)

### 新增元年标准组件

![Create Component Sample](/images/create_component_sample.gif)

## TODO 列表

- 支持元年组件提示回车之后增加对默认属性和默认 slot 的支持。
- 提示元年平台 class 名称
- 支持 JSX 语法
- 支持元年组件标签和属性上鼠标悬停显示帮助文档
