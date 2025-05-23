import { styled } from '@mui/material/styles';
import { Paper, Button } from '@mui/material';
import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts';

export const ChartContainer = styled(Paper)<{ isMobile?: boolean }>`
  padding: ${props => props.isMobile ? '16px' : '24px'};
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(to bottom, #1a237e, #3949ab);
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.isMobile ? '16px' : '24px'};
  }
`;

export const ActionButton = styled(Button)<{ isMobile?: boolean }>`
  border-radius: 30px;
  padding: ${props => props.isMobile ? '8px 16px' : '10px 24px'};
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(26, 35, 126, 0.2);
  }
`;

export const ResponsiveContainer = styled(RechartsResponsiveContainer)<{ isMobile?: boolean }>(({ theme, isMobile }) => ({
  marginTop: theme.spacing(1),
  height: isMobile ? '400px' : '450px',
})); 