import {logger} from 'components/Chat/network';

describe('components/Chat/network', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('does not log in production', () => {
    process.env.NODE_ENV = 'production';

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger('anything');

    expect(spy).not.toHaveBeenCalled();
  });

  it('logs in development', () => {
    process.env.NODE_ENV = 'development';

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger('anything');

    expect(spy).toHaveBeenCalledWith('anything');
  });
});
