import {docApiUrl} from 'components/Chat/network/rest';

describe('docApiUrl', () => {
  it('appends ? when url has no query string', () => {
    expect(docApiUrl('/v1/objects')).toBe('/v1/objects?');
  });

  it('appends & when url already contains query string', () => {
    expect(docApiUrl('/v1/objects?model=groups')).toBe(
      '/v1/objects?model=groups&',
    );
  });

  it('handles urls with multiple existing params', () => {
    expect(docApiUrl('/getMessages?user_id=1&limit=10')).toBe(
      '/getMessages?user_id=1&limit=10&',
    );
  });

  it('handles empty path segment before query', () => {
    expect(docApiUrl('?service=avitochat')).toBe('?service=avitochat&');
  });
});
