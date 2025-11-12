export interface ShowcaseCase {
  id: string;
  title: string;
  image: string; // path under public
  prompt: string;
}

// 静态案例数据（先用占位提示词，后续可替换）
// 布局：根据实际存在的图片文件调整
// 第一行：案例一(2个) + 案例三(2个) = 4个
// 第二行：案例四(1个原图 + 3个效果图) = 4个
// 第三行：案例五(1个原图 + 3个效果图) = 4个
// 总共12个案例，调整为3行×4列布局
export const SHOWCASE_CASES: ShowcaseCase[] = [
  // 第一行：案例一、案例三（各2个）
  { id: 'case-01', title: '案例一', image: '/cases/案例一.jpg', prompt: '占位提示词-案例一' },
  { id: 'case-01-gen', title: '案例一效果图', image: '/cases/案例一效果图.png', prompt: '占位提示词-案例一' },
  { id: 'case-03', title: '案例三', image: '/cases/案例三.jpg', prompt: '占位提示词-案例三' },
  { id: 'case-03-gen', title: '案例三效果图', image: '/cases/案例三效果图.png', prompt: '占位提示词-案例三' },

  // 第二行：案例四（1个原图 + 3个效果图）
  { id: 'case-04', title: '案例四', image: '/cases/案例四.jpg', prompt: '占位提示词-案例四' },
  { id: 'case-04-gen-1', title: '案例四效果图1', image: '/cases/案例四效果图1.png', prompt: '占位提示词-案例四' },
  { id: 'case-04-gen-2', title: '案例四效果图2', image: '/cases/案例四效果图2.png', prompt: '占位提示词-案例四' },
  { id: 'case-04-gen-3', title: '案例四效果图3', image: '/cases/案例四效果图3.png', prompt: '占位提示词-案例四' },

  // 第三行：案例五（1个原图 + 3个效果图）
  { id: 'case-05', title: '案例五', image: '/cases/案例五.jpg', prompt: '占位提示词-案例五' },
  { id: 'case-05-gen-1', title: '案例五效果图1', image: '/cases/案例五效果图1.png', prompt: '占位提示词-案例五' },
  { id: 'case-05-gen-2', title: '案例五效果图2', image: '/cases/案例五效果图2.png', prompt: '占位提示词-案例五' },
  { id: 'case-05-gen-3', title: '案例五效果图3', image: '/cases/案例五效果图3.png', prompt: '占位提示词-案例五' },
];


