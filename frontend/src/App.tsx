
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";
import "./App.dataset.css";
import {
  getFullPrediction,
  getModelPerformance,
  getFeatureImportance,
  getPredictionAnalysis,
  getDatasetSummary,
} from "./services/api";

import type {
  FullPredictionResponse,
  ShipmentRequest,
  ModelPerformanceResponse,
  FeatureImportanceResponse,
  PredictionAnalysisResponse,
  DatasetSummaryResponse,
} from "./services/api";

type ShipmentRecord = {
  shipment_id: string;
  port_name: string;
  vessel_arrival_time: string;
  port_capacity: number;
  vessels_waiting: number;
  queue_length: number;
  weather_condition: string;
  historical_avg_delay: number;
  actual_delay_hours: number;
  congestion_level: string;
};

type Page = "dashboard" | "prediction" | "analytics" | "settings";

const PORT_CAPACITIES: Record<string, number> = {
  Chennai: 20,
  Mumbai: 25,
  Visakhapatnam: 15,
  Kochi: 12,
  Kolkata: 18,
};

const PORT_NAMES = Object.keys(PORT_CAPACITIES);

const CONGESTION_COLORS: Record<string, string> = {
  High: "#e05252",
  Medium: "#e6a23c",
  Low: "#28a879",
};

function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");

  const [shipmentRecords, setShipmentRecords] = useState<ShipmentRecord[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [selectedShipment, setSelectedShipment] =
    useState<ShipmentRecord | null>(null);
  const [datasetError, setDatasetError] = useState("");

  useEffect(() => {
    const loadShipmentDataset = async () => {
      try {
        const response = await fetch("/shipment_data.csv");
        if (!response.ok) {
          throw new Error("Could not load shipment_data.csv from the public folder.");
        }
        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        const headers = lines[0].split(",").map((header) => header.trim());
        const records = lines.slice(1).filter(Boolean).map((line) => {
          const values = line.split(",");
          const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
          return {
            shipment_id: row.shipment_id,
            port_name: row.port_name,
            vessel_arrival_time: row.vessel_arrival_time,
            port_capacity: Number(row.port_capacity),
            vessels_waiting: Number(row.vessels_waiting),
            queue_length: Number(row.queue_length),
            weather_condition: row.weather_condition,
            historical_avg_delay: Number(row.historical_avg_delay),
            actual_delay_hours: Number(row.actual_delay_hours),
            congestion_level: row.congestion_level,
          } as ShipmentRecord;
        });
        setShipmentRecords(records);
      } catch (loadError) {
        setDatasetError(loadError instanceof Error ? loadError.message : "Unable to load shipment dataset.");
      }
    };
    loadShipmentDataset();
  }, []);

  const handleShipmentSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const shipmentId = event.target.value;
    setSelectedShipmentId(shipmentId);
    const record = shipmentRecords.find((item) => item.shipment_id === shipmentId) ?? null;
    setSelectedShipment(record);
    setPrediction(null);
    setError("");
    if (record) {
      setFormData({
        port_name: record.port_name,
        vessels_waiting: record.vessels_waiting,
        queue_length: record.queue_length,
        weather_condition: record.weather_condition,
        historical_avg_delay: record.historical_avg_delay,
        vessel_arrival_time: record.vessel_arrival_time.replace(" ", "T"),
      });
    }
  };

  const [formData, setFormData] = useState({
    port_name: "Chennai",
    vessels_waiting: 25,
    queue_length: 15,
    weather_condition: "Storm",
    historical_avg_delay: 12.5,
    vessel_arrival_time: "2026-11-15T10:30",
  });

  const [prediction, setPrediction] =
    useState<FullPredictionResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Analytics returned by the FastAPI analytics endpoints.
  const [modelPerformance, setModelPerformance] =
    useState<ModelPerformanceResponse | null>(null);
  const [featureImportance, setFeatureImportance] =
    useState<FeatureImportanceResponse | null>(null);
  const [predictionAnalysis, setPredictionAnalysis] =
    useState<PredictionAnalysisResponse | null>(null);
  const [datasetSummary, setDatasetSummary] =
    useState<DatasetSummaryResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");


  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "vessels_waiting" ||
        name === "queue_length" ||
        name === "historical_avg_delay"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setPrediction(null);

    // Clear previous analytics so the page cannot display stale results
    // while the latest request is being processed.
    setAnalyticsError("");
    setModelPerformance(null);
    setFeatureImportance(null);
    setPredictionAnalysis(null);
    setDatasetSummary(null);

    try {
      const requestData: ShipmentRequest = {
        ...formData,
        vessel_arrival_time: formData.vessel_arrival_time,
      };

      // First generate the prediction for the shipment currently in the form.
      const result = await getFullPrediction(requestData);
      setPrediction(result);
      console.log("Prediction response:", result);

      // Then load the independent, test-dataset analytics.
      setAnalyticsLoading(true);
      try {
        const [
          performanceResult,
          importanceResult,
          analysisResult,
          summaryResult,
        ] = await Promise.all([
          getModelPerformance(),
          getFeatureImportance(),
          getPredictionAnalysis(),
          getDatasetSummary(),
        ]);

        setModelPerformance(performanceResult);
        setFeatureImportance(importanceResult);
        setPredictionAnalysis(analysisResult);
        setDatasetSummary(summaryResult);
      } catch (analyticsErr: unknown) {
        console.error("Analytics loading error:", analyticsErr);
        setAnalyticsError(
          analyticsErr instanceof Error
            ? analyticsErr.message
            : "Unable to load model analytics."
        );
      } finally {
        setAnalyticsLoading(false);
      }
    } catch (err: unknown) {
      console.error("Prediction error:", err);

      if (typeof err === "object" && err !== null && "response" in err) {
        const apiError = err as {
          response?: {
            data?: {
              detail?: string | { msg?: string }[];
            };
          };
          message?: string;
        };

        const detail = apiError.response?.data?.detail;

        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(
            detail.map((item) => item.msg ?? "Invalid input").join(", ")
          );
        } else {
          setError(apiError.message ?? "Unable to generate prediction.");
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to the backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setError("");
  };

  const navigationItems: {
    id: Page;
    label: string;
    icon: string;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "prediction", label: "Shipment Prediction", icon: "◉" },
    { id: "analytics", label: "Port Analytics", icon: "▤" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  // Prepare congestion probability chart using API response.
  // The model returns probabilities as decimals, e.g. 0.89.
  const congestionChartData = prediction?.port_congestion.probabilities
    ? Object.entries(prediction.port_congestion.probabilities).map(
        ([level, probability]) => ({
          level,
          probability: probability <= 1
            ? probability * 100
            : probability,
        })
      )
    : [];

  // Port capacity vs actual prediction input.
  const capacityChartData = prediction
    ? [
        {
          category: "Port Capacity",
          vessels: prediction.port_details.port_capacity,
        },
        {
          category: "Vessels Waiting",
          vessels: prediction.port_details.vessels_waiting,
        },
      ]
    : [];

  // Predicted delay vs historical average supplied by the user.
  const delayChartData = prediction
    ? [
        {
          category: "Historical Average",
          hours: formData.historical_avg_delay,
        },
        {
          category: "Predicted Delay",
          hours: prediction.shipment_delay.predicted_delay_hours,
        },
      ]
    : [];


  // Model evaluation and dataset charts use the analytics API responses.
  const modelComparisonChartData =
    modelPerformance?.regression_models.map((model) => ({
      model: model.Model,
      MAE: Number(model.MAE),
      RMSE: Number(model.RMSE),
      R2: Number(model["R2 Score"]),
    })) ?? [];

  const featureImportanceChartData =
    featureImportance?.features
      .slice()
      .sort((a, b) => Number(b.Importance) - Number(a.Importance))
      .slice(0, 10)
      .map((item) => ({
        feature: item.Feature,
        importance: Number(item.Importance),
      })) ?? [];

  const actualPredictedChartData =
    predictionAnalysis?.predictions.slice(0, 30).map((item, index) => ({
      record: `Record ${index + 1}`,
      actual: Number(item.Actual_Delay),
      predicted: Number(item.Predicted_Delay),
    })) ?? [];

  const residualChartData =
    predictionAnalysis?.predictions.slice(0, 30).map((item, index) => ({
      record: `Record ${index + 1}`,
      residual: Number(item.Residual),
      absoluteError: Number(item.Absolute_Error),
    })) ?? [];

  const classificationChartData = (["Low", "Medium", "High"] as const).map(
    (level) => {
      const classMetrics =
        modelPerformance?.congestion_model.classification_report[level];

      if (!classMetrics || typeof classMetrics !== "object") {
        return { level, Precision: 0, Recall: 0, F1: 0 };
      }

      return {
        level,
        Precision: Number(classMetrics.precision),
        Recall: Number(classMetrics.recall),
        F1: Number(classMetrics["f1-score"]),
      };
    }
  );

  const portDistributionChartData = datasetSummary
    ? Object.entries(datasetSummary.port_distribution).map(([name, count]) => ({
        name,
        records: Number(count),
      }))
    : [];

  const weatherDistributionChartData = datasetSummary
    ? Object.entries(datasetSummary.weather_distribution).map(([name, count]) => ({
        name,
        records: Number(count),
      }))
    : [];

  const congestionDistributionChartData = datasetSummary
    ? Object.entries(datasetSummary.congestion_distribution).map(([name, count]) => ({
        name,
        records: Number(count),
      }))
    : [];

  const getContributingFactors = () => {
    if (!prediction) return [];

    const factors: string[] = [];

    if (prediction.port_details.capacity_utilization >= 1) {
      factors.push(
        `Vessel demand exceeds configured port capacity. Utilization is ${(
          prediction.port_details.capacity_utilization * 100
        ).toFixed(1)}%.`
      );
    }

    if (prediction.port_details.queue_length > 0) {
      factors.push(
        `A queue length of ${prediction.port_details.queue_length} indicates vessel waiting pressure.`
      );
    }

    if (prediction.port_details.weather_condition !== "Normal") {
      factors.push(
        `${prediction.port_details.weather_condition} weather may affect port and vessel operations.`
      );
    }

    if (formData.historical_avg_delay > 0) {
      factors.push(
        `Historical average delay is ${formData.historical_avg_delay} hours.`
      );
    }

    if (factors.length === 0) {
      factors.push(
        "The supplied inputs do not show a major pressure indicator. Continue monitoring port activity."
      );
    }

    return factors;
  };

  const getRecommendations = () => {
    if (!prediction) return [];

    const recommendations: string[] = [];

    if (prediction.port_details.capacity_utilization >= 1) {
      recommendations.push(
        "Review berth availability and vessel scheduling because demand is at or above configured capacity."
      );
    }

    if (prediction.port_details.queue_length >= 10) {
      recommendations.push(
        "Monitor vessel queue movement and review arrival schedules to reduce waiting time."
      );
    }

    if (
      prediction.port_details.weather_condition === "Storm" ||
      prediction.port_details.weather_condition === "Foggy" ||
      prediction.port_details.weather_condition === "Rainy"
    ) {
      recommendations.push(
        "Monitor weather updates and assess possible impacts on port operations."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Continue monitoring vessel arrivals, queue length and port capacity."
      );
    }

    recommendations.push(
      "Review the latest prediction with port operations data before making scheduling decisions."
    );

    return recommendations;
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🚢</span>
          <div>
            <h2>PortAI</h2>
            <p>Smart Logistics</p>
          </div>
        </div>

        <nav>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => navigateTo(item.id)}
              aria-current={
                activePage === item.id ? "page" : undefined
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"></span>
          ML Prediction System
          <p>FastAPI integration enabled</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Port Congestion Dashboard</h1>
            <p>AI-powered shipment delay and congestion prediction</p>
          </div>

          <div className="user-profile">
            <span className="avatar">AI</span>
            <span>Admin</span>
          </div>
        </header>

        {/* DASHBOARD PAGE */}
        {activePage === "dashboard" && (
          <>
            <section className="welcome-section">
              <div>
                <h2>Welcome to PortAI Dashboard 👋</h2>
                <p>
                  Monitor port conditions and predict shipment delays
                  using machine learning.
                </p>
              </div>
              <span className="date-label">November 2026</span>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">⚓</div>
                <p>Supported Ports</p>
                <h2>5</h2>
                <span>Indian major ports</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">◷</div>
                <p>Delay Prediction</p>
                <h2>AI Model</h2>
                <span>Estimated delay in hours</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon red">▥</div>
                <p>Congestion Analysis</p>
                <h2>AI Model</h2>
                <span>Low, Medium or High</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <p>Backend Status</p>
                <h2>FastAPI</h2>
                <span>Prediction and analytics APIs configured</span>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Shipment Prediction</h2>
                    <p>Generate a new shipment prediction</p>
                  </div>
                  <span className="form-badge">ML Prediction</span>
                </div>

                <p className="info-description">
                  Submit vessel and port information to estimate
                  shipment delays and congestion.
                </p>

                <button
                  className="predict-button"
                  type="button"
                  onClick={() => navigateTo("prediction")}
                >
                  Go to Shipment Prediction →
                </button>
              </div>

              <div className="panel">
                <h2>Latest Prediction</h2>

                {prediction ? (
                  <>
                    <p className="info-description">
                      Port: {prediction.port_name}
                    </p>
                    <div className="model-note">
                      <strong>Shipment Delay</strong>
                      <p>
                        {prediction.shipment_delay.predicted_delay_hours.toFixed(
                          2
                        )}{" "}
                        hours
                      </p>

                      <strong>Congestion Level</strong>
                      <p>
                        {prediction.port_congestion.predicted_congestion}
                      </p>

                      <strong>Model Confidence</strong>
                      <p>
                        {(
                          prediction.port_congestion.confidence * 100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="info-description">
                    No prediction has been generated in this session yet.
                    Go to Shipment Prediction to get started.
                  </p>
                )}
              </div>
            </section>

            <footer>
              AI Port Congestion & Shipment Delay Prediction System
              <span>React + TypeScript + FastAPI + Machine Learning</span>
            </footer>
          </>
        )}

        {/* SHIPMENT PREDICTION PAGE */}
        {activePage === "prediction" && (
          <>
            <section className="welcome-section">
              <div>
                <h2>Shipment Prediction 🚢</h2>
                <p>
                  Enter shipment details to estimate delay and port
                  congestion.
                </p>
              </div>
              <span className="date-label">ML Prediction Engine</span>
            </section>

            <section className="content-grid">
              <div className="panel form-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Shipment Details</h2>
                    <p>Enter vessel and port information</p>
                  </div>
                  <span className="form-badge">Prediction Input</span>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="dataset-selector">
                    <label htmlFor="shipment_id">Select Existing Shipment (Optional)</label>
                    <select id="shipment_id" value={selectedShipmentId} onChange={handleShipmentSelect}>
                      <option value="">Choose a shipment from the dataset</option>
                      {shipmentRecords.map((record) => (
                        <option key={record.shipment_id} value={record.shipment_id}>
                          {record.shipment_id} · {record.port_name}
                        </option>
                      ))}
                    </select>
                    <p className="info-description">
                      {shipmentRecords.length > 0
                        ? `${shipmentRecords.length} shipment records loaded. Selecting one fills the prediction inputs automatically.`
                        : datasetError || "Loading shipment records..."}
                    </p>
                  </div>

                  {selectedShipment && (
                    <div className="dataset-selected-note">
                      Selected {selectedShipment.shipment_id}. Actual outcomes are kept separate from model inputs.
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="port_name">Select Port</label>
                      <select
                        id="port_name"
                        name="port_name"
                        value={formData.port_name}
                        onChange={handleChange}
                      >
                        {PORT_NAMES.map((port) => (
                          <option key={port} value={port}>
                            {port}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="weather_condition">
                        Weather Condition
                      </label>
                      <select
                        id="weather_condition"
                        name="weather_condition"
                        value={formData.weather_condition}
                        onChange={handleChange}
                      >
                        <option value="Normal">Normal</option>
                        <option value="Rainy">Rainy</option>
                        <option value="Storm">Storm</option>
                        <option value="Foggy">Foggy</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="vessels_waiting">
                        Vessels Waiting
                      </label>
                      <input
                        id="vessels_waiting"
                        name="vessels_waiting"
                        type="number"
                        min="0"
                        value={formData.vessels_waiting}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="queue_length">Queue Length</label>
                      <input
                        id="queue_length"
                        name="queue_length"
                        type="number"
                        min="0"
                        value={formData.queue_length}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="historical_avg_delay">
                        Historical Average Delay (Hours)
                      </label>
                      <input
                        id="historical_avg_delay"
                        name="historical_avg_delay"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.historical_avg_delay}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="vessel_arrival_time">
                        Vessel Arrival Time
                      </label>
                      <input
                        id="vessel_arrival_time"
                        name="vessel_arrival_time"
                        type="datetime-local"
                        value={formData.vessel_arrival_time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="predict-button"
                    disabled={loading}
                  >
                    {loading
                      ? "Generating Prediction..."
                      : "Generate Prediction"}
                    {!loading && <span>→</span>}
                  </button>

                  {loading && (
                    <div className="result-message">
                      Processing shipment details using machine learning...
                    </div>
                  )}

                  {error && (
                    <div className="error-message">
                      Prediction failed: {error}
                    </div>
                  )}

                  {prediction && (
                    <div className="prediction-results">
                      <h2>Prediction Results</h2>

                      <p className="prediction-port">
                        Port: <strong>{prediction.port_name}</strong>
                      </p>

                      <div className="result-grid">
                        <div className="result-card">
                          <span>Predicted Shipment Delay</span>
                          <h3>
                            {prediction.shipment_delay.predicted_delay_hours.toFixed(
                              2
                            )}
                            <small> hours</small>
                          </h3>
                        </div>

                        <div className="result-card">
                          <span>Predicted Port Congestion</span>
                          <h3>
                            {prediction.port_congestion.predicted_congestion}
                          </h3>
                          <p>
                            Model confidence:{" "}
                            {(
                              prediction.port_congestion.confidence * 100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>

                        <div className="result-card">
                          <span>Port Capacity</span>
                          <h3>{prediction.port_details.port_capacity}</h3>
                          <p>
                            Vessels waiting:{" "}
                            {prediction.port_details.vessels_waiting}
                          </p>
                        </div>

                        <div className="result-card">
                          <span>Capacity Utilization</span>
                          <h3>
                            {(
                              prediction.port_details.capacity_utilization *
                              100
                            ).toFixed(1)}
                            %
                          </h3>
                          <p>
                            Queue length:{" "}
                            {prediction.port_details.queue_length}
                          </p>
                        </div>
                      </div>

                      {selectedShipment && (
                        <section className="dataset-actual-results">
                          <h3>Dataset Actual Results</h3>
                          <p>Recorded outcomes for {selectedShipment.shipment_id}, shown for comparison only.</p>
                          <div className="result-grid">
                            <div className="result-card">
                              <span>Actual Shipment Delay</span>
                              <h3>{selectedShipment.actual_delay_hours.toFixed(2)}<small> hours</small></h3>
                            </div>
                            <div className="result-card">
                              <span>Actual Congestion Level</span>
                              <h3>{selectedShipment.congestion_level}</h3>
                            </div>
                            <div className="result-card">
                              <span>Predicted vs Actual Delay Difference</span>
                              <h3>{Math.abs(prediction.shipment_delay.predicted_delay_hours - selectedShipment.actual_delay_hours).toFixed(2)}<small> hours</small></h3>
                            </div>
                          </div>
                          <p className="chart-note">Actual dataset outcomes are not submitted to the prediction API and are not used as prediction features.</p>
                        </section>
                      )}

                      {/* PREDICTION CHARTS */}
                      <section className="prediction-charts">
                        <div className="charts-heading">
                          <h2>Prediction Analytics</h2>
                          <p>
                            Visual comparison of the generated prediction
                            and shipment conditions.
                          </p>
                        </div>

                        <div className="charts-grid">
                          {/* CONGESTION PIE CHART */}
                          <div className="chart-card">
                            <h3>Congestion Probability</h3>
                            <p>
                              Probability distribution across congestion
                              classes.
                            </p>

                            {congestionChartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                  <Pie
                                    data={congestionChartData}
                                    dataKey="probability"
                                    nameKey="level"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    label={({ name, percent }) =>
                                      `${name}: ${(
                                        (percent ?? 0) * 100
                                      ).toFixed(1)}%`
                                    }
                                  >
                                    {congestionChartData.map((entry) => (
                                      <Cell
                                        key={entry.level}
                                        fill={
                                          CONGESTION_COLORS[entry.level] ??
                                          "#64748b"
                                        }
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value) => [
                                      `${Number(value).toFixed(1)}%`,
                                      "Probability",
                                    ]}
                                  />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="chart-empty">
                                Congestion probability details are not
                                available in the API response.
                              </p>
                            )}
                          </div>

                          {/* CAPACITY BAR CHART */}
                          <div className="chart-card">
                            <h3>Port Capacity vs Vessel Traffic</h3>
                            <p>
                              Comparison of configured capacity and
                              vessels waiting.
                            </p>

                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={capacityChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                  dataKey="vessels"
                                  name="Vessel Count"
                                  fill="#3674c9"
                                  radius={[5, 5, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* DELAY COMPARISON BAR CHART */}
                          <div className="chart-card chart-card-wide">
                            <h3>Predicted vs Historical Delay</h3>
                            <p>
                              Comparison of estimated shipment delay
                              against the supplied historical average.
                            </p>

                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={delayChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis
                                  label={{
                                    value: "Hours",
                                    angle: -90,
                                    position: "insideLeft",
                                  }}
                                />
                                <Tooltip
                                  formatter={(value) => [
                                    `${Number(value).toFixed(2)} hours`,
                                    "Delay",
                                  ]}
                                />
                                <Legend />
                                <Bar
                                  dataKey="hours"
                                  name="Delay in Hours"
                                  fill="#239b69"
                                  radius={[5, 5, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <p className="chart-note">
                          Charts are generated from the current API
                          prediction response and submitted shipment
                          inputs. They do not represent live port data.
                        </p>
                      </section>

                      {/* PREDICTION EXPLANATION */}
                      <div className="explanation-section">
                        <h2>Why This Prediction?</h2>
                        <p className="info-description">
                          The following input conditions provide context
                          for the prediction.
                        </p>

                        <ul>
                          {getContributingFactors().map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>

                        <p className="model-note">
                          These are input-based explanations and
                          operational indicators, not a direct SHAP
                          or causal analysis of the model.
                        </p>
                      </div>

                      {/* RECOMMENDATIONS */}
                      <div className="recommendation-section">
                        <h2>Recommended Actions</h2>

                        <ul>
                          {getRecommendations().map(
                            (recommendation, index) => (
                              <li key={index}>{recommendation}</li>
                            )
                          )}
                        </ul>
                      </div>

                      <p className="info-description">
                        Note: Predictions are based on trained models
                        and a synthetic dataset. They are estimates,
                        not guaranteed real-world outcomes.
                      </p>
                    </div>
                  )}
                </form>
              </div>

              <div className="panel info-panel">
                <h2>How It Works</h2>
                <p className="info-description">
                  Our machine learning models analyze shipment and
                  port information to estimate delays and congestion.
                </p>

                <div className="info-step">
                  <span>01</span>
                  <div>
                    <h3>Enter Shipment Details</h3>
                    <p>
                      Provide port, weather and vessel information.
                    </p>
                  </div>
                </div>

                <div className="info-step">
                  <span>02</span>
                  <div>
                    <h3>ML Model Processing</h3>
                    <p>
                      FastAPI processes the input using trained models.
                    </p>
                  </div>
                </div>

                <div className="info-step">
                  <span>03</span>
                  <div>
                    <h3>View Predictions</h3>
                    <p>
                      Get estimated delay and congestion results.
                    </p>
                  </div>
                </div>

                <div className="model-note">
                  <strong>Prediction Engine</strong>
                  <p>Shipment Delay: Regression Model</p>
                  <p>Port Congestion: Classification Model</p>
                </div>
              </div>
            </section>

            <footer>
              AI Port Congestion & Shipment Delay Prediction System
              <span>React + TypeScript + FastAPI + Machine Learning</span>
            </footer>
          </>
        )}

        {/* PORT ANALYTICS PAGE */}
        {activePage === "analytics" && (
          <>
            <section className="welcome-section">
              <div>
                <h2>Port Analytics 📊</h2>
                <p>
                  Review configured port capacities and latest prediction.
                </p>
              </div>
              <span className="date-label">Port Overview</span>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">⚓</div>
                <p>Total Supported Ports</p>
                <h2>5</h2>
                <span>Configured ports</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">▥</div>
                <p>Selected Port</p>
                <h2>{formData.port_name}</h2>
                <span>Current form selection</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon red">◷</div>
                <p>Vessels Waiting</p>
                <h2>
                  {prediction
                    ? prediction.port_details.vessels_waiting
                    : "—"}
                </h2>
                <span>Latest prediction input</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">%</div>
                <p>Capacity Utilization</p>
                <h2>
                  {prediction
                    ? `${(
                        prediction.port_details.capacity_utilization * 100
                      ).toFixed(1)}%`
                    : "—"}
                </h2>
                <span>Latest prediction result</span>
              </div>
            </section>

            <section className="panel analytics-panel">
              <div className="panel-heading">
                <div>
                  <h2>Supported Port Capacity</h2>
                  <p>
                    Configured vessel capacity values used by the application.
                  </p>
                </div>
              </div>

              <div className="analytics-table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Port Name</th>
                      <th>Configured Capacity</th>
                      <th>Current Selection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PORT_NAMES.map((port) => (
                      <tr key={port}>
                        <td>{port}</td>
                        <td>{PORT_CAPACITIES[port]} vessels</td>
                        <td>
                          {formData.port_name === port ? (
                            <span className="form-badge">Selected</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {prediction && (
              <section className="panel analytics-panel">
                <h2>Latest Prediction Analysis</h2>

                <div className="result-grid">
                  <div className="result-card">
                    <span>Predicted Delay</span>
                    <h3>
                      {prediction.shipment_delay.predicted_delay_hours.toFixed(
                        2
                      )}{" "}
                      <small>hours</small>
                    </h3>
                  </div>

                  <div className="result-card">
                    <span>Congestion Level</span>
                    <h3>
                      {prediction.port_congestion.predicted_congestion}
                    </h3>
                  </div>

                  <div className="result-card">
                    <span>Model Confidence</span>
                    <h3>
                      {(prediction.port_congestion.confidence * 100).toFixed(
                        1
                      )}
                      %
                    </h3>
                  </div>

                  <div className="result-card">
                    <span>Weather</span>
                    <h3>{prediction.port_details.weather_condition}</h3>
                  </div>
                </div>
              </section>
            )}

            {!prediction && (
              <section className="panel">
                <p className="info-description">
                  Generate a shipment prediction to view its analysis here.
                </p>
              </section>
            )}

            {/* MODEL PERFORMANCE, FEATURE IMPORTANCE AND DATASET ANALYTICS */}
            <section className="prediction-charts">
              <div className="charts-heading">
                <h2>Machine Learning Model Evaluation</h2>
                <p>
                  Evaluation metrics and dataset insights returned by the backend.
                </p>
              </div>

              {analyticsLoading && (
                <div className="panel">
                  <p className="info-description">
                    Loading model performance and dataset analytics...
                  </p>
                </div>
              )}

              {analyticsError && (
                <div className="error-message">
                  Analytics could not be loaded: {analyticsError}
                </div>
              )}

              {modelPerformance && (
                <>
                  <section className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon blue">◎</div>
                      <p>Regression Models Evaluated</p>
                      <h2>{modelPerformance.regression_models.length}</h2>
                      <span>Shipment delay models</span>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon green">✓</div>
                      <p>Best Regression MAE</p>
                      <h2>
                        {modelPerformance.regression_models.length > 0
                          ? Math.min(
                              ...modelPerformance.regression_models.map((item) =>
                                Number(item.MAE)
                              )
                            ).toFixed(2)
                          : "—"}
                      </h2>
                      <span>Hours, lower is better</span>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon orange">%</div>
                      <p>Congestion Accuracy</p>
                      <h2>
                        {(modelPerformance.congestion_model.accuracy * 100).toFixed(1)}%
                      </h2>
                      <span>Held-out synthetic test data</span>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon red">▤</div>
                      <p>Congestion Test Records</p>
                      <h2>{modelPerformance.congestion_model.testing_records}</h2>
                      <span>Classifier evaluation set</span>
                    </div>
                  </section>

                  <div className="charts-grid">
                    <div className="chart-card chart-card-wide">
                      <h3>Regression Model Comparison</h3>
                      <p>
                        MAE and RMSE compare prediction errors across the delay models.
                        Lower values indicate smaller errors.
                      </p>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={modelComparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="model" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="MAE" name="MAE" fill="#3674c9" radius={[5, 5, 0, 0]} />
                          <Bar dataKey="RMSE" name="RMSE" fill="#e6a23c" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card chart-card-wide">
                      <h3>Regression R² Score</h3>
                      <p>
                        R² indicates how well the regression model explains variation
                        in the target delay values.
                      </p>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={modelComparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="model" />
                          <YAxis domain={['auto', 'auto']} />
                          <Tooltip />
                          <Bar dataKey="R2" name="R² Score" fill="#239b69" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="model-note">
                    <strong>{modelPerformance.congestion_model.model_name}</strong>
                    <p>
                      Training records: {modelPerformance.congestion_model.training_records}
                      {" | "}
                      Testing records: {modelPerformance.congestion_model.testing_records}
                    </p>
                    <p>{modelPerformance.congestion_model.evaluation_note}</p>
                  </div>
                </>
              )}

              {featureImportance && (
                <div className="chart-card chart-card-wide">
                  <h3>Feature Importance</h3>
                  <p>
                    Permutation importance measures how model performance changes
                    when a feature is shuffled. Positive values suggest predictive
                    usefulness in this test setup.
                  </p>
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart
                      data={featureImportanceChartData}
                      layout="vertical"
                      margin={{ left: 35, right: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="feature" width={155} />
                      <Tooltip />
                      <Bar
                        dataKey="importance"
                        name="Permutation Importance"
                        fill="#3674c9"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="chart-note">
                    Feature importance is an interpretation measure, not proof that
                    a feature causes shipment delays.
                  </p>
                </div>
              )}

              {predictionAnalysis && (
                <>
                  <section className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon blue">⌁</div>
                      <p>Regression Test Records</p>
                      <h2>{predictionAnalysis.total_test_records}</h2>
                      <span>Held-out predictions</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon orange">◷</div>
                      <p>Mean Absolute Error</p>
                      <h2>{predictionAnalysis.mean_absolute_error.toFixed(2)}</h2>
                      <span>Hours</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon red">!</div>
                      <p>Maximum Absolute Error</p>
                      <h2>{predictionAnalysis.maximum_absolute_error.toFixed(2)}</h2>
                      <span>Hours</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon green">✓</div>
                      <p>Average Actual Delay</p>
                      <h2>{predictionAnalysis.average_actual_delay.toFixed(2)}</h2>
                      <span>Hours</span>
                    </div>
                  </section>

                  <div className="charts-grid">
                    <div className="chart-card chart-card-wide">
                      <h3>Actual vs Predicted Delay</h3>
                      <p>
                        First 30 records from the held-out regression test predictions.
                      </p>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={actualPredictedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="record" interval="preserveStartEnd" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="actual" name="Actual Delay" fill="#3674c9" />
                          <Bar dataKey="predicted" name="Predicted Delay" fill="#239b69" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card chart-card-wide">
                      <h3>Prediction Residuals</h3>
                      <p>
                        Residual is actual delay minus predicted delay. Values closer
                        to zero indicate smaller signed errors.
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={residualChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="record" interval="preserveStartEnd" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="residual" name="Residual (hours)" fill="#e6a23c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {modelPerformance && (
                <>
                  <div className="chart-card chart-card-wide">
                    <h3>Congestion Classification Metrics</h3>
                    <p>Precision, recall and F1-score for each congestion category.</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={classificationChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis domain={[0, 1]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Precision" fill="#3674c9" />
                        <Bar dataKey="Recall" fill="#239b69" />
                        <Bar dataKey="F1" name="F1 Score" fill="#e6a23c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel analytics-panel">
                    <h3>Congestion Confusion Matrix</h3>
                    <p className="info-description">
                      Rows show actual classes; columns show predicted classes.
                    </p>
                    <div className="analytics-table-wrapper">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Actual / Predicted</th>
                            {modelPerformance.congestion_model.labels.map((label) => (
                              <th key={label}>{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modelPerformance.congestion_model.confusion_matrix.map(
                            (row, rowIndex) => (
                              <tr key={rowIndex}>
                                <th>{modelPerformance.congestion_model.labels[rowIndex] ?? `Class ${rowIndex + 1}`}</th>
                                {row.map((value, columnIndex) => (
                                  <td key={columnIndex}>{value}</td>
                                ))}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {datasetSummary && (
                <>
                  <section className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon blue">▤</div>
                      <p>Dataset Records</p>
                      <h2>{datasetSummary.total_records}</h2>
                      <span>{datasetSummary.dataset_type} dataset</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon orange">◷</div>
                      <p>Average Delay</p>
                      <h2>{datasetSummary.average_delay_hours.toFixed(2)}</h2>
                      <span>Hours</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon green">⚓</div>
                      <p>Average Vessels Waiting</p>
                      <h2>{datasetSummary.average_vessels_waiting.toFixed(2)}</h2>
                      <span>Vessels</span>
                    </div>
                  </section>

                  <div className="charts-grid">
                    <div className="chart-card">
                      <h3>Port Distribution</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={portDistributionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="records" name="Records" fill="#3674c9" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <h3>Weather Distribution</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={weatherDistributionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="records" name="Records" fill="#e6a23c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <h3>Congestion Distribution</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={congestionDistributionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="records" name="Records" fill="#239b69" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="model-note">
                    <strong>Dataset note</strong>
                    <p>{datasetSummary.data_note}</p>
                  </div>
                </>
              )}

              {!analyticsLoading && !analyticsError && !modelPerformance &&
                !featureImportance && !predictionAnalysis && !datasetSummary && (
                  <div className="panel">
                    <p className="info-description">
                      Generate a shipment prediction to load the model and dataset
                      analytics from the backend.
                    </p>
                  </div>
                )}
            </section>

            <footer>
              Port Analytics
              <span>Based on configured capacities and prediction results</span>
            </footer>
          </>
        )}

        {/* SETTINGS PAGE */}
        {activePage === "settings" && (
          <>
            <section className="welcome-section">
              <div>
                <h2>System Settings ⚙</h2>
                <p>
                  Application configuration, model information and
                  supported input categories.
                </p>
              </div>
              <span className="date-label">System Information</span>
            </section>

            <section className="panel settings-panel">
              <h2>Application Information</h2>

              <div className="settings-list">
                <div className="settings-item">
                  <span>Application Name</span>
                  <strong>PortAI Smart Logistics</strong>
                </div>

                <div className="settings-item">
                  <span>Frontend</span>
                  <strong>React + TypeScript</strong>
                </div>

                <div className="settings-item">
                  <span>Backend</span>
                  <strong>Python + FastAPI</strong>
                </div>

                <div className="settings-item">
                  <span>API Endpoint</span>
                  <strong>http://127.0.0.1:8000</strong>
                </div>

                <div className="settings-item">
                  <span>Prediction Endpoint</span>
                  <strong>/predict/full</strong>
                </div>
              </div>
            </section>

            <section className="panel settings-panel">
              <h2>Machine Learning Models</h2>

              <div className="settings-list">
                <div className="settings-item">
                  <span>Shipment Delay Model</span>
                  <strong>Linear Regression</strong>
                </div>

                <div className="settings-item">
                  <span>Port Congestion Model</span>
                  <strong>Random Forest Classifier</strong>
                </div>

                <div className="settings-item">
                  <span>Congestion Classes</span>
                  <strong>Low / Medium / High</strong>
                </div>

                <div className="settings-item">
                  <span>Dataset Type</span>
                  <strong>Synthetic Shipment Dataset</strong>
                </div>
              </div>
            </section>

            <section className="panel settings-panel">
              <h2>Supported Input Categories</h2>

              <div className="settings-list">
                <div className="settings-item">
                  <span>Ports</span>
                  <strong>{PORT_NAMES.join(", ")}</strong>
                </div>

                <div className="settings-item">
                  <span>Weather Conditions</span>
                  <strong>Normal, Rainy, Storm, Foggy</strong>
                </div>

                <div className="settings-item">
                  <span>Prediction Types</span>
                  <strong>Shipment Delay and Port Congestion</strong>
                </div>
              </div>
            </section>

            <div className="model-note">
              <strong>Model Limitation</strong>
              <p>
                This application uses a synthetic dataset for development
                and evaluation. Predictions are estimates and have not
                been validated against live port operations.
              </p>
            </div>

            <footer>
              PortAI System Settings
              <span>AI Port Congestion & Shipment Delay Prediction System</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
