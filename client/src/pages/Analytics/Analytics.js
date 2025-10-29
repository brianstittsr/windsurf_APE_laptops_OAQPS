import React, { useState } from 'react';
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
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
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
import localStorageService from '../../services/localStorageService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics = () => {
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSchema, setSelectedSchema] = useState('all');

  // Fetch analytics data from localStorage
  const { data: analytics, isLoading, refetch } = useQuery(
    selectedYear === 'all' && selectedSchema === 'all' ? 'base-analytics' : ['analytics', selectedYear, selectedSchema],
    () => {
      // Always start with base analytics to ensure consistency with Dashboard
      const baseAnalytics = localStorageService.generateAnalytics();
      
      // Only apply filters if they're not 'all'
      if (selectedYear === 'all' && selectedSchema === 'all') {
        return baseAnalytics;
      }
      
      // Apply filters for non-'all' selections
      let filteredInvoices = localStorageService.getInvoices();
      
      if (selectedYear !== 'all') {
        filteredInvoices = filteredInvoices.filter(inv => inv.fiscalYear.toString() === selectedYear);
      }
      
      if (selectedSchema !== 'all') {
        filteredInvoices = filteredInvoices.filter(inv => inv.schema === selectedSchema);
      }
      
      // Recalculate analytics for filtered data
      const totalValue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAwardAmount, 0);
      return {
        ...baseAnalytics,
        totalInvoices: filteredInvoices.length,
        totalValue,
        averageValue: filteredInvoices.length ? totalValue / filteredInvoices.length : 0,
        byFiscalYear: localStorageService.groupByFiscalYear(filteredInvoices),
        bySchema: localStorageService.groupBySchema(filteredInvoices)
      };
    }
  );

  // Generate fiscal year comparison data
  const { data: fiscalYearData } = useQuery(
    'fiscal-year-comparison',
    () => {
      const analytics = localStorageService.generateAnalytics();
      return analytics.byFiscalYear;
    }
  );

  // Generate monthly trends data
  const { data: monthlyTrends } = useQuery(
    ['monthly-trends', selectedYear],
    () => {
      const invoices = localStorageService.getInvoices();
      const filteredInvoices = selectedYear !== 'all' 
        ? invoices.filter(inv => inv.fiscalYear.toString() === selectedYear)
        : invoices;
      
      // Group by month
      const monthlyData = {};
      filteredInvoices.forEach(invoice => {
        const date = new Date(invoice.contractDate);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            monthName,
            totalValue: 0,
            count: 0
          };
        }
        
        monthlyData[monthKey].totalValue += invoice.totalAwardAmount;
        monthlyData[monthKey].count += 1;
      });
      
      const sortedMonths = Object.keys(monthlyData).sort();
      const monthlyTrends = sortedMonths.map(key => monthlyData[key]);
      
      return { monthlyTrends };
    }
  );

  // Generate top vendors data (replacing "products")
  const { data: topProducts } = useQuery(
    ['top-vendors', selectedYear],
    () => {
      const invoices = localStorageService.getInvoices();
      const filteredInvoices = selectedYear !== 'all' 
        ? invoices.filter(inv => inv.fiscalYear.toString() === selectedYear)
        : invoices;
      
      // Group by vendor
      const vendorData = {};
      filteredInvoices.forEach(invoice => {
        const vendor = invoice.vendorName;
        if (!vendorData[vendor]) {
          vendorData[vendor] = {
            name: vendor,
            totalValue: 0,
            totalQuantity: 0
          };
        }
        
        vendorData[vendor].totalValue += invoice.totalAwardAmount;
        vendorData[vendor].totalQuantity += 1;
      });
      
      return Object.values(vendorData)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);
    }
  );

  // Generate location analysis data
  const { data: locationAnalysis } = useQuery(
    ['location-analysis', selectedYear],
    () => {
      const invoices = localStorageService.getInvoices();
      const filteredInvoices = selectedYear !== 'all' 
        ? invoices.filter(inv => inv.fiscalYear.toString() === selectedYear)
        : invoices;
      
      const totalValue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAwardAmount, 0);
      
      // Group by place of performance
      const locationData = {};
      filteredInvoices.forEach(invoice => {
        const location = invoice.placeOfPerformance || 'Unknown';
        if (!locationData[location]) {
          locationData[location] = {
            name: location,
            totalValue: 0,
            orderCount: 0
          };
        }
        
        locationData[location].totalValue += invoice.totalAwardAmount;
        locationData[location].orderCount += 1;
      });
      
      return Object.values(locationData)
        .map(location => ({
          ...location,
          percentageOfTotal: totalValue > 0 ? ((location.totalValue / totalValue) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);
    }
  );

  const availableYears = analytics ? Object.keys(analytics.byFiscalYear || {}) : [];

  // Chart configurations
  const fiscalYearChartData = {
    labels: Object.keys(fiscalYearData || {}).map(year => `FY${year}`),
    datasets: [
      {
        label: 'Total Value ($)',
        data: Object.values(fiscalYearData || {}).map(year => year.value),
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1,
      },
      {
        label: 'Contract Count',
        data: Object.values(fiscalYearData || {}).map(year => year.count),
        backgroundColor: 'rgba(46, 125, 50, 0.8)',
        borderColor: 'rgba(46, 125, 50, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const monthlyTrendsChartData = {
    labels: monthlyTrends?.monthlyTrends?.map(trend => trend.monthName) || [],
    datasets: [
      {
        label: 'Total Value ($)',
        data: monthlyTrends?.monthlyTrends?.map(trend => trend.totalValue) || [],
        borderColor: 'rgba(25, 118, 210, 1)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const topProductsChartData = {
    labels: topProducts?.slice(0, 5).map(product => product.name || 'Unknown') || [],
    datasets: [
      {
        data: topProducts?.slice(0, 5).map(product => product.totalValue || 0) || [],
        backgroundColor: [
          'rgba(25, 118, 210, 0.8)',
          'rgba(46, 125, 50, 0.8)',
          'rgba(237, 108, 2, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(211, 47, 47, 0.8)',
        ],
        borderColor: [
          'rgba(25, 118, 210, 1)',
          'rgba(46, 125, 50, 1)',
          'rgba(237, 108, 2, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(211, 47, 47, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Loading Analytics...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Analytics Dashboard
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Fiscal Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Fiscal Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>FY{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Document Schema</InputLabel>
                <Select
                  value={selectedSchema}
                  label="Document Schema"
                  onChange={(e) => setSelectedSchema(e.target.value)}
                >
                  <MenuItem value="all">All Schemas</MenuItem>
                  <MenuItem value="EPA Laptop Procurement">EPA Laptop Procurement</MenuItem>
                  <MenuItem value="EPA Desktop and Monitor Procurement">EPA Desktop and Monitor Procurement</MenuItem>
                  <MenuItem value="Blanket Purchase Agreement Services">BPA Services</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Invoices
                </Typography>
                <Typography variant="h4" color="primary">
                  {analytics?.totalInvoices?.toLocaleString() || '0'}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Value
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${analytics?.totalValue?.toLocaleString() || '0'}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Value
                </Typography>
                <Typography variant="h4" color="warning.main">
                  ${analytics?.averageValue?.toLocaleString() || '0'}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Fiscal Years
                </Typography>
                <Typography variant="h4" color="info.main">
                  {Object.keys(analytics?.byFiscalYear || {}).length}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Fiscal Year Comparison */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChartIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Fiscal Year Comparison</Typography>
              </Box>
              {fiscalYearData && Object.keys(fiscalYearData).length > 0 ? (
                <Bar data={fiscalYearChartData} options={chartOptions} />
              ) : (
                <Alert severity="info">No fiscal year data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PieChartIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Top Vendors</Typography>
              </Box>
              {topProducts && topProducts.length > 0 ? (
                <Pie data={topProductsChartData} />
              ) : (
                <Alert severity="info">No vendor data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trends */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Monthly Trends</Typography>
              </Box>
              {monthlyTrends?.monthlyTrends && monthlyTrends.monthlyTrends.length > 0 ? (
                <Line data={monthlyTrendsChartData} options={lineChartOptions} />
              ) : (
                <Alert severity="info">No monthly trend data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Tables */}
      <Grid container spacing={3}>
        {/* Top Products Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Vendors by Value
              </Typography>
              {topProducts && topProducts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vendor</TableCell>
                        <TableCell align="right">Contracts</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.slice(0, 10).map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{product.totalQuantity}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`$${product.totalValue.toLocaleString()}`}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No vendor data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Location Analysis Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location Analysis
              </Typography>
              {locationAnalysis && locationAnalysis.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Location</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {locationAnalysis.slice(0, 10).map((location, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {location.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{location.orderCount}</TableCell>
                          <TableCell align="right">
                            ${location.totalValue.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${location.percentageOfTotal}%`}
                              color="secondary"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No location data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
