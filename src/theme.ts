import type {GlobalThemeOverrides} from 'naive-ui';

// Mirrors assets/core/tokens.css so framework controls share the site's cool-gray/teal palette and density.
const sans="'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',sans-serif";
const mono="'JetBrains Mono','SFMono-Regular','Cascadia Mono',Consolas,'Liberation Mono',monospace";

export const themeOverrides:GlobalThemeOverrides={
  common:{
    primaryColor:'#0e7c74',primaryColorHover:'#12918a',primaryColorPressed:'#0a5f59',primaryColorSuppl:'#12918a',
    infoColor:'#2f63d1',successColor:'#15803d',warningColor:'#a16207',errorColor:'#c0362c',
    textColorBase:'#0f1722',textColor1:'#0f1722',textColor2:'#364152',textColor3:'#5f6b7a',placeholderColor:'#8a94a3',
    borderColor:'#d4d9e0',dividerColor:'#e4e7ec',cardColor:'#ffffff',modalColor:'#ffffff',popoverColor:'#ffffff',
    tableHeaderColor:'#f9fafb',hoverColor:'rgba(14,124,116,.07)',
    fontFamily:sans,fontFamilyMono:mono,fontSize:'13px',fontSizeMedium:'13px',fontSizeSmall:'12px',
    heightMedium:'34px',heightSmall:'28px',heightLarge:'38px',
    borderRadius:'6px',borderRadiusSmall:'4px',
    boxShadow2:'0 1px 2px rgba(15,23,34,.05), 0 6px 18px -10px rgba(15,23,34,.16)',
  },
  Button:{fontWeight:'500',paddingMedium:'0 15px'},
  Card:{borderRadius:'10px',paddingMedium:'18px 20px',titleFontSizeMedium:'15px'},
  Tabs:{tabFontSizeMedium:'13px',tabTextColorActiveLine:'#0a5f59',tabTextColorHoverLine:'#0f1722',barColor:'#0e7c74',tabGapMediumLine:'26px'},
  DataTable:{thFontWeight:'500',thTextColor:'#5f6b7a',fontSizeMedium:'12.5px'},
  Menu:{itemTextColorActiveHorizontal:'#0a5f59',itemTextColorHoverHorizontal:'#0f1722'},
};
