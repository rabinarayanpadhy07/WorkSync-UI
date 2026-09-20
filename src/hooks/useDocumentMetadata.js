import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_METADATA = {
  title: 'WorkSync',
  description:
    'WorkSync helps teams chat in channels, coordinate workspaces, and collaborate in real time.',
  image: '/vite.svg'
};

const metadataRules = [
  {
    matches: (pathname) => pathname.startsWith('/auth/signin'),
    title: 'Sign In | WorkSync',
    description: 'Sign in to your WorkSync workspace and continue collaborating with your team.'
  },
  {
    matches: (pathname) => pathname.startsWith('/auth/signup'),
    title: 'Create Account | WorkSync',
    description: 'Create a WorkSync account to launch workspaces, channels, and team collaboration.'
  },
  {
    matches: (pathname) => pathname.startsWith('/admin'),
    title: 'Admin Dashboard | WorkSync',
    description: 'Review WorkSync administration insights, moderation tools, audits, and workspace health.'
  },
  {
    matches: (pathname) => pathname.startsWith('/workspaces/create'),
    title: 'Create Workspace | WorkSync',
    description: 'Set up a new WorkSync workspace for your team, project, or client collaboration.'
  },
  {
    matches: (pathname) => pathname.startsWith('/workspaces/join'),
    title: 'Join Workspace | WorkSync',
    description: 'Join an existing WorkSync workspace with a secure invite code.'
  },
  {
    matches: (pathname) => pathname.startsWith('/workspaces/'),
    title: 'Workspace | WorkSync',
    description: 'Collaborate in WorkSync channels, threads, drafts, and direct messages.'
  },
  {
    matches: (pathname) => pathname.startsWith('/makepayment'),
    title: 'Upgrade Plan | WorkSync',
    description: 'Upgrade your WorkSync plan to unlock more workspaces, channels, and premium collaboration.'
  },
  {
    matches: (pathname) => pathname.startsWith('/home'),
    title: 'Home | WorkSync',
    description: 'Choose where to continue in WorkSync, create a workspace, or join your team.'
  }
];

const updateMetaTag = (selector, attribute, value) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
};

export const useDocumentMetadata = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const routeMetadata =
      metadataRules.find((rule) => rule.matches(pathname)) || DEFAULT_METADATA;

    document.title = routeMetadata.title || DEFAULT_METADATA.title;

    updateMetaTag(
      'meta[name="description"]',
      'content',
      routeMetadata.description || DEFAULT_METADATA.description
    );
    updateMetaTag(
      'meta[property="og:title"]',
      'content',
      routeMetadata.title || DEFAULT_METADATA.title
    );
    updateMetaTag(
      'meta[property="og:description"]',
      'content',
      routeMetadata.description || DEFAULT_METADATA.description
    );
    updateMetaTag(
      'meta[property="og:url"]',
      'content',
      globalThis.location?.href || 'http://localhost:5173'
    );
    updateMetaTag(
      'meta[property="og:image"]',
      'content',
      routeMetadata.image || DEFAULT_METADATA.image
    );
    updateMetaTag(
      'meta[name="twitter:title"]',
      'content',
      routeMetadata.title || DEFAULT_METADATA.title
    );
    updateMetaTag(
      'meta[name="twitter:description"]',
      'content',
      routeMetadata.description || DEFAULT_METADATA.description
    );
    updateMetaTag(
      'meta[name="twitter:image"]',
      'content',
      routeMetadata.image || DEFAULT_METADATA.image
    );
  }, [pathname]);
};
