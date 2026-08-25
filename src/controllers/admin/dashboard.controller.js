import * as metricsService from "../../services/metrics.service.js";

export const renderDashboard = async (req, res, next) => {
  try {
    const stats = await metricsService.getDashboardMetrics(
      req.cookies.jwt_token,
    );
    res.render("admin/dashboard", { activePage: "dashboard", stats });
  } catch (err) {
    next(err);
  }
};
