import React from 'react';
import { Stack, IconButton, Tooltip } from '@mui/material';
import { LinkedIn, X, YouTube, Reddit } from '@mui/icons-material';
import { Github } from 'lucide-react';
import MediumIcon from './icons/MediumIcon';
import SubstackIcon from './icons/SubstackIcon';
import KaggleIcon from './icons/KaggleIcon';
import DiscordIcon from './icons/DiscordIcon';

interface SocialIconsProps {
  /** Icon button size */
  size?: 'small' | 'medium';
  /** Icon pixel size (default 18) */
  iconSize?: number;
  /** Spacing between icons (default 0.5) */
  spacing?: number;
  /** Layout direction (default 'row') */
  direction?: 'row' | 'column';
}

interface SocialLink {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  url: string;
}

const SocialIcons: React.FC<SocialIconsProps> = ({
  size = 'small',
  iconSize = 18,
  spacing = 0.5,
  direction = 'row',
}) => {
  // Build links array — only include platforms with a configured URL
  const allLinks: (SocialLink | null)[] = [
    import.meta.env.VITE_SOCIAL_LINKEDIN
      ? {
          icon: <LinkedIn sx={{ fontSize: iconSize }} />,
          label: 'LinkedIn',
          tooltip: 'Follow us on LinkedIn',
          url: import.meta.env.VITE_SOCIAL_LINKEDIN,
        }
      : null,
    import.meta.env.VITE_SOCIAL_TWITTER
      ? {
          icon: <X sx={{ fontSize: iconSize }} />,
          label: 'Twitter',
          tooltip: 'Follow us on X',
          url: import.meta.env.VITE_SOCIAL_TWITTER,
        }
      : null,
    import.meta.env.VITE_SOCIAL_YOUTUBE
      ? {
          icon: <YouTube sx={{ fontSize: iconSize }} />,
          label: 'YouTube',
          tooltip: 'Subscribe on YouTube',
          url: import.meta.env.VITE_SOCIAL_YOUTUBE,
        }
      : null,
    import.meta.env.VITE_SOCIAL_GITHUB
      ? {
          icon: <Github size={iconSize} />,
          label: 'GitHub',
          tooltip: 'Star us on GitHub',
          url: import.meta.env.VITE_SOCIAL_GITHUB,
        }
      : null,
    import.meta.env.VITE_SOCIAL_MEDIUM
      ? {
          icon: <MediumIcon sx={{ fontSize: iconSize }} />,
          label: 'Medium',
          tooltip: 'Read us on Medium',
          url: import.meta.env.VITE_SOCIAL_MEDIUM,
        }
      : null,
    import.meta.env.VITE_SOCIAL_SUBSTACK
      ? {
          icon: <SubstackIcon sx={{ fontSize: iconSize }} />,
          label: 'Substack',
          tooltip: 'Subscribe on Substack',
          url: import.meta.env.VITE_SOCIAL_SUBSTACK,
        }
      : null,
    import.meta.env.VITE_SOCIAL_REDDIT
      ? {
          icon: <Reddit sx={{ fontSize: iconSize }} />,
          label: 'Reddit',
          tooltip: 'Join us on Reddit',
          url: import.meta.env.VITE_SOCIAL_REDDIT,
        }
      : null,
    import.meta.env.VITE_SOCIAL_KAGGLE
      ? {
          icon: <KaggleIcon sx={{ fontSize: iconSize }} />,
          label: 'Kaggle',
          tooltip: 'Compete on Kaggle',
          url: import.meta.env.VITE_SOCIAL_KAGGLE,
        }
      : null,
    import.meta.env.VITE_SOCIAL_DISCORD
      ? {
          icon: <DiscordIcon sx={{ fontSize: iconSize }} />,
          label: 'Discord',
          tooltip: 'Join us on Discord',
          url: import.meta.env.VITE_SOCIAL_DISCORD,
        }
      : null,
  ];

  const socialLinks = allLinks.filter(
    (link): link is SocialLink => link !== null
  );

  if (socialLinks.length === 0) return null;

  return (
    <Stack
      direction={direction}
      spacing={spacing}
      alignItems="center"
      justifyContent="center"
      useFlexGap
      sx={{ flexWrap: 'nowrap' }}
    >
      {socialLinks.map((social) => (
        <Tooltip key={social.label} title={social.tooltip} arrow>
          <IconButton
            component="a"
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            size={size}
            sx={{
              color: 'text.secondary',
              p: 0.4,
              minWidth: 0,
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            aria-label={social.label}
          >
            {social.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
};

export default SocialIcons;
