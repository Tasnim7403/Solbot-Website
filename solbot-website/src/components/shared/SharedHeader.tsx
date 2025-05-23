import React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Badge,
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import styled from 'styled-components';

const Header = styled(Box)<{ isMobile?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: ${props => props.isMobile ? 'wrap' : 'nowrap'};
  gap: ${props => props.isMobile ? '16px' : '0'};
  
  ${props => props.isMobile && `
    .title {
      width: 100%;
      order: 1;
    }
    .actions {
      width: 100%;
      order: 3;
      justify-content: center;
    }
    .user-section {
      width: 100%;
      order: 2;
      justify-content: flex-end;
    }
  `}
`;

const SearchBar = styled(Paper)<{ isMobile?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  width: ${props => props.isMobile ? '100%' : '300px'};
  border-radius: 20px;
  background-color: white;
  margin-right: ${props => props.isMobile ? '0' : '16px'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:focus-within {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const MobileMenuButton = styled(IconButton)<{ isMobile?: boolean }>`
  display: ${props => props.isMobile ? 'flex' : 'none'};
  margin-right: 8px;
`;

interface SharedHeaderProps {
  title: string;
  onMenuClick?: () => void;
  userName?: string;
  userAvatar?: string;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({
  title,
  onMenuClick,
  userName = 'Tesnim',
  userAvatar = '/avatar.jpg',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Header isMobile={isMobile}>
      <Box className="title" sx={{ display: 'flex', alignItems: 'center' }}>
        <MobileMenuButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          isMobile={isMobile}
        >
          <MenuIcon />
        </MobileMenuButton>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="600">{title}</Typography>
      </Box>
      
      <Box className="user-section" sx={{ display: 'flex', alignItems: 'center' }}>
        <SearchBar elevation={0} isMobile={isMobile}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <input
            placeholder="Search..."
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              background: 'transparent',
              fontSize: isMobile ? '14px' : '16px',
            }}
          />
        </SearchBar>
        <IconButton>
          <Badge color="error" variant="dot">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Box sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ textAlign: 'right' }}>Hello,</Typography>
            <Typography variant="subtitle2" fontWeight="600">{userName}</Typography>
          </Box>
          <Avatar src={userAvatar} />
        </Box>
      </Box>
    </Header>
  );
};

export default SharedHeader; 