import { buildQueryString, buildHeaders, KeyValue } from './requestHelpers';

describe('buildQueryString', () => {
  it('should build a query string from key-value pairs', () => {
    const params: KeyValue[] = [
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' }
    ];
    expect(buildQueryString(params)).toBe('foo=bar&baz=qux');
  });

  it('should skip empty keys', () => {
    const params: KeyValue[] = [
      { key: '', value: 'bar' },
      { key: 'baz', value: 'qux' }
    ];
    expect(buildQueryString(params)).toBe('baz=qux');
  });
});

describe('buildHeaders', () => {
  it('should build a headers object from key-value pairs', () => {
    const headers: KeyValue[] = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer token' }
    ];
    expect(buildHeaders(headers)).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token'
    });
  });

  it('should skip empty keys', () => {
    const headers: KeyValue[] = [
      { key: '', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer token' }
    ];
    expect(buildHeaders(headers)).toEqual({
      'Authorization': 'Bearer token'
    });
  });
});
