// Service for interacting with the AirNow API

const AIRNOW_API_BASE_URL = 'https://www.airnowapi.org/aq/observation/zipCode/current/';

export const queryAirnowApi = async (zipCode, apiKey) => {
  const response = await fetch(`${AIRNOW_API_BASE_URL}?format=application/json&zipCode=${zipCode}&distance=25&API_KEY=${apiKey}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const generateMockAirnowData = (zipCode) => {
  const pollutants = ['O3', 'PM2.5'];
  return pollutants.map(pollutant => ({
    DateObserved: new Date().toISOString().split('T')[0],
    HourObserved: new Date().getHours(),
    LocalTimeZone: 'EST',
    ReportingArea: `Mock Area for ${zipCode}`,
    StateCode: 'MC',
    Latitude: 35.7796,
    Longitude: -78.6382,
    ParameterName: pollutant,
    AQI: Math.floor(Math.random() * 200),
    Category: { Number: Math.floor(Math.random() * 5) + 1, Name: 'Mock Category' },
  }));
};
