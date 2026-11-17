
import axios from "axios";

// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// SHIPMENT REQUEST INTERFACE
// ==========================================

export interface ShipmentRequest {
  port_name: string;
  vessels_waiting: number;
  queue_length: number;
  weather_condition: string;
  historical_avg_delay: number;
  vessel_arrival_time: string;
}

// ==========================================
// FULL PREDICTION RESPONSE
// ==========================================

export interface FullPredictionResponse {
  status: string;
  port_name: string;

  shipment_delay: {
    predicted_delay_hours: number;
  };

  port_congestion: {
    predicted_congestion: string;
    confidence: number;
    probabilities?: Record<string, number>;
  };

  port_details: {
    port_capacity: number;
    vessels_waiting: number;
    queue_length: number;
    capacity_utilization: number;
    weather_condition: string;
  };
}

// ==========================================
// REGRESSION MODEL METRICS
// ==========================================

export interface RegressionModelMetric {
  Model: string;
  MAE: number;
  RMSE: number;
  "R2 Score": number;
}

// ==========================================
// CONGESTION CLASSIFICATION METRICS
// ==========================================

export interface ClassificationMetrics {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
}

export interface CongestionModelMetrics {
  model_name: string;
  dataset_type: string;
  total_records: number;
  training_records: number;
  testing_records: number;
  accuracy: number;
  labels: string[];

  classification_report: Record<
    string,
    ClassificationMetrics | number
  >;

  confusion_matrix: number[][];
  evaluation_note: string;
}

export interface ModelPerformanceResponse {
  status: string;
  regression_models: RegressionModelMetric[];
  congestion_model: CongestionModelMetrics;
}

// ==========================================
// FEATURE IMPORTANCE RESPONSE
// ==========================================

export interface FeatureImportance {
  Feature: string;
  Importance: number;
  Std_Deviation: number;
}

export interface FeatureImportanceResponse {
  status: string;
  method: string;
  description: string;
  features: FeatureImportance[];
}

// ==========================================
// PREDICTION ANALYSIS RESPONSE
// ==========================================

export interface PredictionAnalysisRecord {
  Actual_Delay: number;
  Predicted_Delay: number;
  Residual: number;
  Absolute_Error: number;
}

export interface PredictionAnalysisResponse {
  status: string;
  total_test_records: number;
  mean_absolute_error: number;
  maximum_absolute_error: number;
  average_actual_delay: number;
  average_predicted_delay: number;
  predictions: PredictionAnalysisRecord[];
}

// ==========================================
// DATASET SUMMARY RESPONSE
// ==========================================

export interface DatasetSummaryResponse {
  status: string;
  dataset_type: string;
  total_records: number;
  average_delay_hours: number;
  average_vessels_waiting: number;
  port_distribution: Record<string, number>;
  weather_distribution: Record<string, number>;
  congestion_distribution: Record<string, number>;
  data_note: string;
}

// ==========================================
// 1. FULL SHIPMENT PREDICTION
// ==========================================

export const getFullPrediction = async (
  shipment: ShipmentRequest
): Promise<FullPredictionResponse> => {
  const response = await api.post<FullPredictionResponse>(
    "/predict/full",
    shipment
  );

  return response.data;
};

// ==========================================
// 2. MODEL PERFORMANCE ANALYTICS
// ==========================================

export const getModelPerformance =
  async (): Promise<ModelPerformanceResponse> => {
    const response = await api.get<ModelPerformanceResponse>(
      "/analytics/model-performance"
    );

    return response.data;
  };

// ==========================================
// 3. FEATURE IMPORTANCE ANALYTICS
// ==========================================

export const getFeatureImportance =
  async (): Promise<FeatureImportanceResponse> => {
    const response = await api.get<FeatureImportanceResponse>(
      "/analytics/feature-importance"
    );

    return response.data;
  };

// ==========================================
// 4. PREDICTION ERROR ANALYSIS
// ==========================================

export const getPredictionAnalysis =
  async (): Promise<PredictionAnalysisResponse> => {
    const response = await api.get<PredictionAnalysisResponse>(
      "/analytics/prediction-analysis"
    );

    return response.data;
  };

// ==========================================
// 5. DATASET SUMMARY ANALYTICS
// ==========================================

export const getDatasetSummary =
  async (): Promise<DatasetSummaryResponse> => {
    const response = await api.get<DatasetSummaryResponse>(
      "/analytics/dataset-summary"
    );

    return response.data;
  };
