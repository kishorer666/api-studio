import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RequestCollection from '../RequestCollection';

const mkReq = (id: string, name?: string) => ({
  id,
  name: name ?? id,
  method: 'GET',
  url: 'https://example.com',
  params: [],
  headers: [],
  body: '',
  bodyType: 'application/json',
});

describe('RequestCollection requestsSource filtering', () => {
  it('renders only requests from requestsSource when provided', () => {
    const colReqs = [mkReq('a','Alpha'), mkReq('b','Beta')];
    render(
      <RequestCollection
        onLoad={() => {}}
        current={{ method:'GET', url:'', params:[], headers:[], body:'', bodyType:'application/json' }}
        requestsSource={colReqs}
        workspaceContext={{ workspaceId: 'ws1', collectionId: 'c1' }}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('updates list when requestsSource changes', () => {
    const { rerender } = render(
      <RequestCollection
        onLoad={() => {}}
        current={{ method:'GET', url:'', params:[], headers:[], body:'', bodyType:'application/json' }}
        requestsSource={[mkReq('x','Xray')]}
        workspaceContext={{ workspaceId: 'ws1', collectionId: 'c1' }}
      />
    );
    expect(screen.getByText('Xray')).toBeInTheDocument();
    rerender(
      <RequestCollection
        onLoad={() => {}}
        current={{ method:'GET', url:'', params:[], headers:[], body:'', bodyType:'application/json' }}
        requestsSource={[mkReq('y','Yankee')]}
        workspaceContext={{ workspaceId: 'ws1', collectionId: 'c1' }}
      />
    );
    expect(screen.queryByText('Xray')).not.toBeInTheDocument();
    expect(screen.getByText('Yankee')).toBeInTheDocument();
  });
});
