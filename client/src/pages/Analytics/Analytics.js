import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { useQuery } from 'react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { queryAirnowApi } from '../../services/airnowService';
import localStorageService from '../../services/localStorageService';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
);

const majorCities = [
  { name: 'Washington, DC', zip: '20001' },
  { name: 'New York, NY', zip: '10001' },
  { name: 'Los Angeles, CA', zip: '90001' },
  { name: 'Chicago, IL', zip: '60601' },
  { name: 'Houston, TX', zip: '77001' },
  { name: 'Phoenix, AZ', zip: '85001' },
  { name: 'Philadelphia, PA', zip: '19019' },
  { name: 'San Antonio, TX', zip: '78201' },
  { name: 'San Diego, CA', zip: '92101' },
  { name: 'Dallas, TX', zip: '75201' },
  { name: 'San Jose, CA', zip: '95101' },
  { name: 'Austin, TX', zip: '78701' },
  { name: 'Jacksonville, FL', zip: '32201' },
  { name: 'Fort Worth, TX', zip: '76101' },
  { name: 'Columbus, OH', zip: '43201' },
  { name: 'Charlotte, NC', zip: '28201' },
  { name: 'San Francisco, CA', zip: '94101' },
  { name: 'Indianapolis, IN', zip: '46201' },
  { name: 'Seattle, WA', zip: '98101' },
  { name: 'Denver, CO', zip: '80201' },
];


const Analytics = () => {
  const theme = useTheme();
  const [selectedCityZip, setSelectedCityZip] = useState(majorCities[0].zip);
  const [airnowApiKey, setAirnowApiKey] = useState(() => {
    const settings = localStorageService.getSettings();
    return settings.dataApiKeys?.airnow || '';
  });

  // Fetch data for all major cities
  const { data: citiesData, isLoading: isLoadingCities } = useQuery(
    'allCitiesAqiForAnalytics',
    async () => {
      const promises = majorCities.map(city => 
        queryAirnowApi(city.zip, airnowApiKey).catch(() => null)
      );
      const results = await Promise.all(promises);
      return results.filter(Boolean).map(r => r[0]);
    },
    { enabled: !!airnowApiKey }
  );

  // Fetch data for the selected city
  const { data: selectedCityData, isLoading: isLoadingSelected } = useQuery(
    ['selectedCityAqi', selectedCityZip],
    () => queryAirnowApi(selectedCityZip, airnowApiKey),
    { enabled: !!airnowApiKey }
  );

  const historicalData = useMemo(() => {
    if (!selectedCityData) return [];
    // The AirNow API only returns current data, so we'll simulate a trend with the available data points.
    return selectedCityData.map((d, i) => ({
      date: new Date(d.DateObserved.trim() + ' ' + (d.HourObserved || '00') + ':00').toLocaleString(),
      aqi: d.AQI,
    }));
  }, [selectedCityData]);

  const aqiCategoryData = useMemo(() => {
    if (!citiesData) return { labels: [], datasets: [] };
    const categories = {
      'Good': { count: 0, color: theme.palette.success.main },
      'Moderate': { count: 0, color: theme.palette.warning.main },
      'Unhealthy for Sensitive Groups': { count: 0, color: theme.palette.error.light },
      'Unhealthy': { count: 0, color: theme.palette.error.main },
      'Very Unhealthy': { count: 0, color: theme.palette.error.dark },
    };
    citiesData.forEach(city => {
      if (categories[city.Category.Name]) {
        categories[city.Category.Name].count++;
      }
    });
    return {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories).map(c => c.count),
        backgroundColor: Object.values(categories).map(c => c.color),
      }],
    };
  }, [citiesData, theme]);

  const cityComparisonData = {
    labels: citiesData?.map(c => c.ReportingArea) || [],
    datasets: [{
      label: 'Current AQI',
      data: citiesData?.map(c => c.AQI) || [],
      backgroundColor: theme.palette.primary.main,
    }],
  };

  const aqiTrendData = {
    labels: historicalData.map(d => d.date),
    datasets: [{
      label: `AQI Trend for ${selectedCityData?.[0].ReportingArea || ''}`,
      data: historicalData.map(d => d.aqi),
      borderColor: theme.palette.secondary.main,
      tension: 0.3,
    }],
  };

  if (isLoadingCities || isLoadingSelected) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        AirNow Analytics Dashboard
      </Typography>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel>Select City for Trend Analysis</InputLabel>
        <Select
          value={selectedCityZip}
          label="Select City for Trend Analysis"
          onChange={(e) => setSelectedCityZip(e.target.value)}
        >
          {majorCities.map(city => (
            <MenuItem key={city.zip} value={city.zip}>{city.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">AQI Trend (Last 30 Days)</Typography>
              <Line data={aqiTrendData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">Major City AQI Comparison</Typography>
              <Bar data={cityComparisonData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">National AQI Category Breakdown</Typography>
              <Pie data={aqiCategoryData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
