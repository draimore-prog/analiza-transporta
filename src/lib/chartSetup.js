import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(ChartDataLabels);

// Default datalabels settings - disabled by default unless explicitly configured in chart options
Chart.defaults.set("plugins.datalabels", {
  display: false
});

export { Chart, ChartDataLabels };
export default Chart;
