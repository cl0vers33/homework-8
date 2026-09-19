/* ===== 昆明天气信息中心 主脚本 =====
 * 第一步：区块切换与导航高亮
 * 命名口径：data（数据）/ render（渲染）/ bindEvents（事件），用 IIFE 避免全局污染
 */
(function () {
  'use strict';

  // 站内三个区块（三维昆明为独立子页面 three-d/scene.html）
  const SECTION_IDS = ['home', 'query', 'board'];

  const App = {
    // render：切换显示的区块并高亮导航当前项
    showSection(sectionId) {
      if (!SECTION_IDS.includes(sectionId)) {
        sectionId = 'home';
      }
      SECTION_IDS.forEach((id) => {
        $('#' + id).toggleClass('d-none', id !== sectionId);
      });
      $('#navMenu .nav-link').each(function () {
        const active = $(this).data('section') === sectionId;
        $(this).toggleClass('active', active);
        if (active) {
          $(this).attr('aria-current', 'page');
        } else {
          $(this).removeAttr('aria-current');
        }
      });
    },

    // bindEvents：导航点击（事件委托）+ 浏览器前进后退
    bindEvents() {
      $(document).on('click', '[data-section]', (event) => {
        event.preventDefault();
        const sectionId = $(event.currentTarget).data('section');
        this.showSection(sectionId);
        if (location.hash !== '#' + sectionId) {
          history.pushState(null, '', '#' + sectionId);
        }
        // 手机宽度下点击后收起折叠导航
        $('#mainNav').collapse('hide');
        window.scrollTo(0, 0);
      });

      $(window).on('popstate', () => {
        this.showSection(location.hash.slice(1));
      });
    },

    init() {
      this.bindEvents();
      this.showSection(location.hash.slice(1));
    }
  };

  $(() => App.init());
})();
