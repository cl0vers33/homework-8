/* ===== 迷你版校园信息中心 主脚本 =====
 * 第一步：区块切换与导航高亮
 * 命名按 data / render / bindEvents 口径组织，避免全局污染
 */
(function () {
  'use strict';

  // 三个站内区块（校园三维为独立子页面 three-d/scene.html）
  const SECTION_IDS = ['home', 'rooms', 'stats'];

  const App = {
    // render：切换显示的区块
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

    // bindEvents：导航点击 + 初始 hash
    bindEvents() {
      // 事件委托：导航菜单与首页卡片上的 data-section 链接统一处理
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
