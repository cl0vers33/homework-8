/* ===== 昆明天气信息中心 主脚本 =====
 * 第二步：数据加载 + 天气筛选交互 + ECharts/Chart.js 双图表 + 首页摘要联动
 * 模块划分：data（数据）/ render（渲染）/ bindEvents（事件），IIFE 避免全局污染
 */
(function () {
  'use strict';

  // 站内三个区块（三维昆明为独立子页面 three-d/scene.html）
  const SECTION_IDS = ['home', 'query', 'board'];

  /* ================= data：天气数据 ================= */

  // 原始数据（weather.json 或兜底的 window.WEATHER_DATA），加载后不再改动
  let weatherData = null;

  // 把课程六的 series 结构转成"一天一条记录"的数组，方便筛选与渲染
  function buildDayRecords(data) {
    const series = {};
    data.series.forEach((s) => { series[s.category] = s; });
    const highs = series['最高气温'].counts;
    const lows = series['最低气温'].counts;
    const rains = series['降水量'].counts;
    return data.days.map((day, i) => ({
      day: day,
      high: highs[i],
      low: lows[i],
      rain: rains[i],
      condition: rains[i] > 0 ? 'rain' : 'sunny'
    }));
  }

  // 加载 weather.json；失败时回退到 data/weather.js 的内置数据（课程六双格式模式）
  async function loadWeatherData() {
    // file:// 协议下浏览器会在网络层拦截 fetch 并打印红色报错，
    // 直接走 weather.js 兜底，保证 Console 干净
    if (location.protocol === 'file:') {
      if (typeof window.WEATHER_DATA === 'object' && window.WEATHER_DATA) {
        return {
          data: window.WEATHER_DATA,
          notice: '当前以 file:// 方式直接打开，浏览器禁止读取本地 weather.json，' +
                  '已使用 data/weather.js 内置数据；通过本地服务器打开可加载数据文件。'
        };
      }
      return { data: null, notice: '天气数据不可用：file:// 下无内置兜底数据。' };
    }
    try {
      const response = await fetch('data/weather.json');
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const json = await response.json();
      // 数据格式校验：必须有 days 与 series 数组
      if (!json || !Array.isArray(json.days) || !Array.isArray(json.series)) {
        throw new Error('数据格式错误：缺少 days 或 series 数组');
      }
      return { data: json, notice: null };
    } catch (error) {
      if (typeof window.WEATHER_DATA === 'object' && window.WEATHER_DATA) {
        return {
          data: window.WEATHER_DATA,
          notice: 'weather.json 加载失败（' + error.message +
                  '），已使用 data/weather.js 内置数据。'
        };
      }
      return { data: null, notice: '天气数据加载失败：' + error.message };
    }
  }

  /* ---------- data：读取筛选条件与过滤 ---------- */
  function getFilters() {
    return {
      condition: $('#filterCondition').val(),
      temp: $('#filterTemp').val(),
      keyword: $('#filterKeyword').val().trim()
    };
  }

  function filterDays(filters) {
    return App.days.filter((rec) => {
      const conditionOk =
        filters.condition === 'all' || rec.condition === filters.condition;
      const tempOk =
        filters.temp === 'all' ||
        (filters.temp === 'warm' ? rec.high >= 22 : rec.high < 22);
      const keywordOk = rec.day.indexOf(filters.keyword) !== -1;
      return conditionOk && tempOk && keywordOk;
    });
  }

  /* ================= render：渲染各区块 ================= */

  const CONDITION_META = {
    rain:  { text: '降水日', cls: 'text-bg-info' },
    sunny: { text: '无降水', cls: 'text-bg-warning' }
  };

  // render：首页摘要（模块间数据衔接：查询、看板、首页共用同一份数据）
  function renderSummary() {
    const highs = weatherData.series.find((s) => s.category === '最高气温').counts;
    const rains = weatherData.series.find((s) => s.category === '降水量').counts;
    const avgHigh = (highs.reduce((a, b) => a + b, 0) / highs.length).toFixed(1);
    const rainDays = rains.filter((v) => v > 0).length;
    const totalRain = rains.reduce((a, b) => a + b, 0).toFixed(1);

    $('#summaryRow .summary-value').eq(0).text(avgHigh + ' ℃');
    $('#summaryRow .summary-value').eq(1).text(rainDays + ' 天');
    $('#summaryRow .summary-value').eq(2).text(totalRain + ' mm');
    $('#summaryRow .summary-value').eq(3)
      .text('课程六数据集').removeClass('placeholder-grey');
  }

  // render：天气查询列表
  function renderDays() {
    const days = filterDays(getFilters());
    const $list = $('#dayList');
    $list.empty(); // 先清空，防止筛选后残留旧卡片

    $('#dayCount').text('共 ' + days.length + ' 天');

    if (days.length === 0) {
      $list.append(
        '<div class="col-12"><div class="empty-box p-5 rounded-3 text-center text-secondary">' +
        '没有符合条件的日子，请调整筛选条件。</div></div>'
      );
      return;
    }

    days.forEach((rec) => {
      const meta = CONDITION_META[rec.condition];
      const card =
        '<div class="col-md-6 col-xl-4">' +
          '<div class="card day-card h-100">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<h3 class="h5 mb-0">' + rec.day + '</h3>' +
                '<span class="badge ' + meta.cls + '">' + meta.text + '</span>' +
              '</div>' +
              '<p class="mb-1 text-secondary"><span class="me-1">气温：</span>' +
                rec.low + ' ~ ' + rec.high + ' ℃</p>' +
              '<p class="mb-0 text-secondary"><span class="me-1">降水量：</span>' +
                rec.rain + ' mm</p>' +
            '</div>' +
          '</div>' +
        '</div>';
      $list.append(card);
    });
  }

  // render：ECharts 降水量柱状图（课堂六模式：init 前判断实例，防叠影）
  let rainChart = null;

  function renderRainChart() {
    const el = document.getElementById('rainChart');
    rainChart = echarts.getInstanceByDom(el) || echarts.init(el);
    const rains = weatherData.series.find((s) => s.category === '降水量');

    rainChart.setOption({
      title: {
        text: '七日降水量柱状图',
        subtext: '数据来源：课程六数据集（教学演示数据）'
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => value + ' mm'
      },
      grid: { left: 50, right: 20, top: 80, bottom: 40 },
      xAxis: { type: 'category', data: weatherData.days },
      yAxis: { type: 'value', name: '降水量（mm）', min: 0 },
      series: [{
        name: '降水量',
        type: 'bar',
        data: rains.counts,
        itemStyle: { color: '#29a3a3' },
        label: { show: true, position: 'top', formatter: '{c}' }
      }]
    });
  }

  // render：Chart.js 气温折线图（最高温/最低温两条线，第二课堂六第四步模式）
  let tempChart = null;

  function renderTempChart() {
    const el = document.getElementById('tempChart');
    if (tempChart) {
      tempChart.destroy(); // 重复渲染前先销毁，防止叠影
    }
    const highs = weatherData.series.find((s) => s.category === '最高气温');
    const lows = weatherData.series.find((s) => s.category === '最低气温');

    tempChart = new Chart(el, {
      type: 'line',
      data: {
        labels: weatherData.days,
        datasets: [
          {
            label: '最高气温（℃）',
            data: highs.counts,
            borderColor: '#e07b39',
            backgroundColor: 'rgba(224, 123, 57, 0.15)',
            tension: 0.3,
            fill: true
          },
          {
            label: '最低气温（℃）',
            data: lows.counts,
            borderColor: '#1769aa',
            backgroundColor: 'rgba(23, 105, 170, 0.15)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: '七日气温折线图（℃）' },
          subtitle: { display: true, text: '数据来源：课程六数据集（教学演示数据）' }
        },
        scales: {
          y: { beginAtZero: false, title: { display: true, text: '℃' } }
        }
      }
    });
  }

  function showNotice(selector, message) {
    $(selector)
      .removeClass('d-none alert-danger')
      .addClass('alert-warning')
      .text(message);
  }

  /* ================= 应用主体：导航 / 初始化 ================= */

  const App = {
    days: [],
    boardLoaded: false,

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

      // 图表容器在 display:none 时宽高为 0，且必须等数据就绪后再初始化
      if (sectionId === 'board' && weatherData && !this.boardLoaded) {
        this.initBoard();
      }
      if (sectionId === 'board' && rainChart) {
        rainChart.resize();
      }
    },

    async initBoard() {
      this.boardLoaded = true;
      renderRainChart();
      renderTempChart();
    },

    // bindEvents：导航、筛选、窗口缩放
    bindEvents() {
      // 事件委托：导航与首页卡片上的 data-section 链接统一处理
      $(document).on('click', '[data-section]', (event) => {
        event.preventDefault();
        const sectionId = $(event.currentTarget).data('section');
        this.showSection(sectionId);
        if (location.hash !== '#' + sectionId) {
          history.pushState(null, '', '#' + sectionId);
        }
        $('#mainNav').collapse('hide');
        window.scrollTo(0, 0);
      });

      $(window).on('popstate', () => {
        this.showSection(location.hash.slice(1));
      });

      // 课堂五事件委托：筛选栏任意 select / input 变化即重新渲染
      $('#dayFilters').on('change input', 'select, input', renderDays);

      // 窗口宽度变化时 ECharts 自适应（Chart.js 自带 responsive）
      $(window).on('resize', () => {
        if (rainChart) {
          rainChart.resize();
        }
      });
    },

    async initData() {
      const result = await loadWeatherData();
      if (!result.data) {
        // 断网且无兜底数据：给出明确提示，不再渲染
        showNotice('#queryAlert', result.notice);
        showNotice('#boardAlert', result.notice);
        $('#dayCount').text('数据不可用');
        return;
      }
      if (result.notice) {
        showNotice('#queryAlert', result.notice);
      }
      if (result.data.days.length === 0) {
        showNotice('#queryAlert', '天气数据为空，暂无记录可查询。');
        return;
      }
      weatherData = result.data;
      this.days = buildDayRecords(weatherData);
      renderSummary();   // 首页摘要与数据衔接
      renderDays();      // 查询列表首屏渲染
      $('#boardSource').text('数据来源：' + weatherData.title +
        '（课程六数据集，教学演示数据，非真实统计）');
      // 若数据返回前用户已切到看板区块，此刻补初始化图表
      if (!$('#board').hasClass('d-none') && !this.boardLoaded) {
        this.initBoard();
      }
    },

    init() {
      this.bindEvents();
      this.showSection(location.hash.slice(1));
      this.initData();
    }
  };

  $(() => App.init());
})();
