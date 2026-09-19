/* ===== 迷你版校园信息中心 主脚本 =====
 * 第二步：自习室筛选交互 + data.json 加载 + ECharts 柱状图
 * 模块划分：data（数据） / render（渲染） / bindEvents（事件）
 */
(function () {
  'use strict';

  // 三个站内区块（校园三维为独立子页面 three-d/scene.html）
  const SECTION_IDS = ['home', 'rooms', 'stats'];

  /* ---------- data：自习室数据（按要求直接写死在 JS 数组） ---------- */
  const ROOMS = [
    { id: 1, name: '第一自习室', floor: 1, seats: 120, status: 'open',   hours: '07:00 - 22:30' },
    { id: 2, name: '第二自习室', floor: 1, seats: 80,  status: 'open',   hours: '07:00 - 22:30' },
    { id: 3, name: '报刊阅览室', floor: 1, seats: 40,  status: 'repair', hours: '暂停开放' },
    { id: 4, name: '第三自习室', floor: 2, seats: 150, status: 'open',   hours: '08:00 - 22:00' },
    { id: 5, name: '电子阅览室', floor: 2, seats: 60,  status: 'open',   hours: '08:00 - 21:30' },
    { id: 6, name: '研讨间A',    floor: 2, seats: 20,  status: 'closed', hours: '今日已闭馆' },
    { id: 7, name: '第四自习室', floor: 3, seats: 100, status: 'open',   hours: '07:30 - 22:30' },
    { id: 8, name: '静音自习舱', floor: 3, seats: 30,  status: 'open',   hours: '09:00 - 22:00' },
    { id: 9, name: '研讨间B',    floor: 3, seats: 16,  status: 'repair', hours: '暂停开放' }
  ];

  const STATUS_META = {
    open:   { text: '开放中', cls: 'text-bg-success' },
    closed: { text: '已闭馆', cls: 'text-bg-secondary' },
    repair: { text: '维护中', cls: 'text-bg-warning' }
  };

  // 内置兜底数据：双击 index.html（file://）时浏览器禁止 fetch 本地文件，
  // 用它保证页面仍可查看，并在页面上给出明确提示
  const USAGE_FALLBACK = {
    month: '2026-03',
    source: '内置示例数据',
    unit: '人次',
    rooms: [
      { name: '第一自习室', usage: 1820, rate: 92 },
      { name: '第二自习室', usage: 1354, rate: 78 },
      { name: '第三自习室', usage: 2105, rate: 95 },
      { name: '第四自习室', usage: 1490, rate: 81 },
      { name: '电子阅览室', usage: 960,  rate: 64 },
      { name: '静音自习舱', usage: 586,  rate: 88 }
    ]
  };

  /* ---------- data：读取筛选条件与过滤 ---------- */
  function getFilters() {
    return {
      floor: $('#filterFloor').val(),
      status: $('#filterStatus').val(),
      keyword: $('#filterKeyword').val().trim()
    };
  }

  function filterRooms(filters) {
    return ROOMS.filter((room) => {
      const floorOk = filters.floor === 'all' || room.floor === Number(filters.floor);
      const statusOk = filters.status === 'all' || room.status === filters.status;
      const keywordOk = room.name.indexOf(filters.keyword) !== -1;
      return floorOk && statusOk && keywordOk;
    });
  }

  /* ---------- data：加载 data.json ---------- */
  async function loadUsageData() {
    // file:// 协议下浏览器会在网络层拦截对本地文件的读取（产生红色报错），
    // 直接使用内置示例数据并提示，保证 Console 干净
    if (location.protocol === 'file:') {
      return {
        data: USAGE_FALLBACK,
        notice: '当前以 file:// 方式直接打开，浏览器禁止读取本地 data.json，' +
                '已使用内置示例数据；通过本地服务器打开可加载 data.json。'
      };
    }
    try {
      const response = await fetch('data/data.json');
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const json = await response.json();
      // 数据格式校验：rooms 必须是数组
      if (!json || !Array.isArray(json.rooms)) {
        throw new Error('数据格式错误：缺少 rooms 数组');
      }
      return { data: json, notice: null };
    } catch (error) {
      // 断网 / 文件名错误 / 格式错：给出明确提示并回退到内置示例数据
      return {
        data: USAGE_FALLBACK,
        notice: 'data.json 加载失败（' + error.message + '），已切换为内置示例数据。'
      };
    }
  }

  /* ---------- render：自习室列表 ---------- */
  function renderRooms() {
    const rooms = filterRooms(getFilters());
    const $list = $('#roomList');
    $list.empty(); // 先清空，防止筛选后残留旧卡片

    $('#roomCount').text('共 ' + rooms.length + ' 间');

    if (rooms.length === 0) {
      $list.append(
        '<div class="col-12"><div class="empty-box p-5 rounded-3 text-center text-secondary">' +
        '没有符合条件的自习室，请调整筛选条件。</div></div>'
      );
      return;
    }

    rooms.forEach((room) => {
      const meta = STATUS_META[room.status] || STATUS_META.closed;
      const card =
        '<div class="col-md-6 col-xl-4">' +
          '<div class="card room-card h-100">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<h3 class="h5 mb-0">' + room.name + '</h3>' +
                '<span class="badge ' + meta.cls + '">' + meta.text + '</span>' +
              '</div>' +
              '<p class="mb-1 text-secondary"><span class="me-1">楼层：</span>' + room.floor + ' 层</p>' +
              '<p class="mb-1 text-secondary"><span class="me-1">座位：</span>' + room.seats + ' 个</p>' +
              '<p class="mb-0 text-secondary"><span class="me-1">时间：</span>' + room.hours + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';
      $list.append(card);
    });
  }

  /* ---------- render：ECharts 柱状图 ---------- */
  let usageChart = null;

  function renderUsageChart(data) {
    const el = document.getElementById('usageChart');
    // init 前判断实例：同一容器 init 两次会叠影
    usageChart = echarts.getInstanceByDom(el) || echarts.init(el);

    usageChart.setOption({
      title: {
        text: '各自习室本月使用量',
        subtext: '统计月份：' + data.month + '　数据来源：' + data.source
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => value + ' 人次'
      },
      grid: { left: 60, right: 30, top: 80, bottom: 40 },
      xAxis: {
        type: 'category',
        data: data.rooms.map((room) => room.name),
        axisLabel: { interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: '使用量（人次）',
        min: 0
      },
      series: [{
        name: '使用量',
        type: 'bar',
        data: data.rooms.map((room) => room.usage),
        itemStyle: { color: '#1769aa' },
        label: { show: true, position: 'top', formatter: '{c}' }
      }]
    });
  }

  function showStatsAlert(message) {
    $('#statsAlert')
      .removeClass('d-none alert-danger')
      .addClass('alert-warning')
      .text(message);
  }

  /* ---------- 应用主体：导航 / 初始化 ---------- */
  const App = {
    statsLoaded: false,

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

      // 统计区块第一次显示时再加载并初始化（隐藏时容器宽高为 0）
      if (sectionId === 'stats' && !this.statsLoaded) {
        this.initStats();
      }
      // 区块显示后让图表重新适配尺寸
      if (sectionId === 'stats' && usageChart) {
        usageChart.resize();
      }
    },

    async initStats() {
      this.statsLoaded = true;
      const result = await loadUsageData();
      if (result.notice) {
        showStatsAlert(result.notice);
      }
      if (result.data.rooms.length === 0) {
        showStatsAlert('统计数据为空，暂无使用量记录。');
        return;
      }
      renderUsageChart(result.data);
    },

    // bindEvents：导航、筛选、窗口缩放
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

      // 课堂五事件委托：筛选栏任意 select / input 变化即重新渲染
      $('#roomFilters').on('change input', 'select, input', renderRooms);

      // 窗口宽度变化时图表自适应
      $(window).on('resize', () => {
        if (usageChart) {
          usageChart.resize();
        }
      });
    },

    init() {
      this.bindEvents();
      renderRooms();
      this.showSection(location.hash.slice(1));
    }
  };

  $(() => App.init());
})();
