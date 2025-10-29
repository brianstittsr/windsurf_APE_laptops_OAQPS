import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Thermostat as ThermostatIcon,
  WbSunny as WbSunnyIcon,
  LocationCity as LocationCityIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { queryAirnowApi, generateMockAirnowData } from '../../services/airnowService';
import localStorageService from '../../services/localStorageService';

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

const Dashboard = () => {
  const theme = useTheme();
  const [airnowApiKey, setAirnowApiKey] = useState(() => {
    const settings = localStorageService.getSettings();
    return settings.dataApiKeys?.airnow || '';
  });
  const [selectedCityZip, setSelectedCityZip] = useState(majorCities[0].zip); // Default to Raleigh

  const { data: cityData, isLoading, isError } = useQuery(
    ['cityAqi', selectedCityZip, airnowApiKey],
    () => queryAirnowApi(selectedCityZip, airnowApiKey),
    {
      enabled: !!airnowApiKey && !!selectedCityZip,
      onError: (error) => {
        toast.error(`AirNow API error: ${error.message}`);
      },
      initialData: () => {
        if (!airnowApiKey) {
          return generateMockAirnowData(selectedCityZip);
        }
        return undefined;
      },
    }
  );

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return theme.palette.success.main;
    if (aqi <= 100) return theme.palette.warning.main;
    if (aqi <= 150) return theme.palette.error.main;
    return theme.palette.error.dark;
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  const currentData = cityData?.[0] || {};
  const aqi = currentData.AQI || 0;
  const reportingArea = currentData.ReportingArea || 'N/A';
  const primaryPollutant = currentData.ParameterName || 'N/A';
  const aqiCategory = currentData.Category?.Name || 'N/A';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
          Air Quality Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>City</InputLabel>
          <Select
            value={selectedCityZip}
            label="City"
            onChange={(e) => setSelectedCityZip(e.target.value)}
          >
            {majorCities.map((city) => (
              <MenuItem key={city.zip} value={city.zip}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!airnowApiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The AirNow API key is not set. Data cannot be fetched. Please update the component state to include a valid API key.
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {isError && airnowApiKey && (
        <Alert severity="error" sx={{ mb: 2 }}>
          An error occurred while fetching data. Please check the API key and network connection.
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Current AQI" value={aqi} icon={<BarChartIcon fontSize="large" />} color={getAqiColor(aqi)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Reporting Area" value={reportingArea} icon={<LocationCityIcon fontSize="large" />} color={theme.palette.primary.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Primary Pollutant" value={primaryPollutant} icon={<WbSunnyIcon fontSize="large" />} color={theme.palette.info.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="AQI Category" value={aqiCategory} icon={<ThermostatIcon fontSize="large" />} color={getAqiColor(aqi)} />
        </Grid>
      </Grid>

      {/* Detailed Data View */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Details for {reportingArea}</Typography>
          {cityData && cityData.length > 0 ? (
            <Grid container spacing={2}>
              {cityData.map((pollutant, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{ p: 2, border: `1px solid ${getAqiColor(pollutant.AQI)}`, borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="h6">{pollutant.ParameterName}</Typography>
                    <Typography variant="h3" sx={{ color: getAqiColor(pollutant.AQI) }}>
                      {pollutant.AQI}
                    </Typography>
                    <Typography variant="body2">{pollutant.Category.Name}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No data available for the selected city.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
