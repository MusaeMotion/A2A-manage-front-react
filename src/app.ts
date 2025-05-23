// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
/*
export async function getInitialState(): Promise<{ name: string }> {
  return { name: '位元灵感'  };
}*/

export const layout = () => {
  return {
    logo: 'https://oss.musaemotion.com/logo500.png',
    menu: {
      locale: false,
    },
  };
};
