/* weather.js：与 weather.json 完全相同的数据。
 * 课程六的双格式兜底模式：file:// 直接双击打开时浏览器禁止 fetch 读取本地
 * JSON，此时加载本文件，从 window.WEATHER_DATA 取数据，页面照常工作。
 * 通过本地服务器打开时优先加载 weather.json。
 */
window.WEATHER_DATA = {
  title: "昆明天气周报（2026年9月6日—12日）",
  days: ["9月6日", "9月7日", "9月8日", "9月9日", "9月10日", "9月11日", "9月12日"],
  series: [
    { category: "最高气温", unit: "℃", stat: "avg", counts: [24, 22, 21, 25, 23, 22, 24] },
    { category: "最低气温", unit: "℃", stat: "avg", counts: [17, 16, 15, 17, 16, 15, 16] },
    { category: "降水量", unit: "mm", stat: "sum", counts: [0, 4.2, 7.8, 0, 1.5, 6.3, 0] }
  ]
};
