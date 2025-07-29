import { defineConfig } from '@umijs/max';

export default defineConfig({
  outputPath: 'dist',
  esbuildMinifyIIFE: true,
  history: { type: 'hash' },
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '位元灵感A2A',
  },
  routes: [
    {
      path: '/',
      redirect: '/conversations',
    },
    {
      name: '对话',
      path: '/conversations',
      component: './Conversations',
      icon: 'MessageOutlined',
    },
    {
      name: '任务列表',
      path: '/task',
      component: './Task',
      icon: 'OrderedListOutlined',
    },
    {
      name: '智能体注册中心',
      path: '/remote-agent',
      component: './RemoteAgent',
      icon: 'DiscordOutlined',
    },
    {
      name: 'HostAgent设置',
      path: '/host-agent-setting',
      component: './HostAgentSetting',
      icon: 'SettingOutlined',
    },
    {
      name: 'Mcp智能体',
      path: '/mcp-agent',
      component: './McpServer',
      icon: 'AppstoreOutlined',
    },
  ],
  npmClient: 'pnpm',
  mock: false,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:10001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api',
      },
    },
    '/mcp': {
      target: 'http://127.0.0.1:9992',
      changeOrigin: true,
      pathRewrite: {
        '^/mcp': '/api',
      },
    },
  },
});
