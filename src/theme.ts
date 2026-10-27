import type {GlobalThemeOverrides} from 'naive-ui';

// Mirrors assets/core/tokens.css so framework controls share the site's paper/jade palette and density.
const sans="'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',sans-serif";
const mono="'JetBrains Mono','SFMono-Regular','Cascadia Mono',Consolas,'Liberation Mono',monospace";

export const themeOverrides:GlobalThemeOverrides={
  common:{
    primaryColor:'#2f7d6b',primaryColorHover:'#3a8c78',primaryColorPressed:'#235f51',primaryColorSuppl:'#3a8c78',
    infoColor:'#41699b',successColor:'#3f8560',warningColor:'#a97a1c',errorColor:'#b05a51',
    textColorBase:'#242b2e',textColor1:'#242b2e',textColor2:'#4d565b',textColor3:'#79828a',placeholderColor:'#9ba3a9',
    borderColor:'#ddd7c8',dividerColor:'#e9e4d8',cardColor:'#ffffff',modalColor:'#ffffff',popoverColor:'#ffffff',
    tableHeaderColor:'#fdfcf9',hoverColor:'rgba(47,125,107,.07)',
    fontFamily:sans,fontFamilyMono:mono,fontSize:'13px',fontSizeMedium:'13px',fontSizeSmall:'12px',
    heightMedium:'34px',heightSmall:'28px',heightLarge:'38px',
    borderRadius:'7px',borderRadiusSmall:'5px',
    boxShadow2:'0 1px 2px rgba(48,44,30,.05), 0 6px 18px -10px rgba(48,44,30,.14)',
  },
  Button:{fontWeight:'500',paddingMedium:'0 15px'},
  Card:{borderRadius:'11px',paddingMedium:'18px 20px',titleFontSizeMedium:'15px'},
  Tabs:{tabFontSizeMedium:'13px',tabTextColorActiveLine:'#235f51',tabTextColorHoverLine:'#242b2e',barColor:'#2f7d6b',tabGapMediumLine:'26px'},
  DataTable:{thFontWeight:'500',thTextColor:'#79828a',fontSizeMedium:'12.5px'},
  Menu:{itemTextColorActiveHorizontal:'#235f51',itemTextColorHoverHorizontal:'#242b2e'},
};
