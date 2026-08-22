import observe, {emitData} from 'utils/observers';

describe('observers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers listeners but does not emit until emitData is called', () => {
    const cb = jest.fn();
    observe('myObserver', {myObserver: cb});

    // observe() does not set `observerName`, so emitChange() does nothing
    // until emitData(type, ... ) is called.
    expect(cb).not.toHaveBeenCalled();

    emitData('myObserver', {a: 1}, 'title');

    expect(cb).toHaveBeenCalledWith({a: 1}, 'title');
  });

  it('emits provided val to corresponding listener', () => {
    const cb = jest.fn();
    observe('myObserver', {myObserver: cb});

    emitData('myObserver', {a: 1}, 'title');

    expect(cb).toHaveBeenCalledWith({a: 1}, 'title');
  });

  it('swallows listener errors and warns', () => {
    const cb = jest.fn(() => {
      throw new Error('boom');
    });

    const warnSpy = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    observe('myObserver', {myObserver: cb});

    emitData('myObserver', {a: 1}, 'title');

    expect(warnSpy).toHaveBeenCalled();
  });

  it('cleanup disables further emissions', () => {
    const cb = jest.fn();
    const cleanup = observe('myObserver', {myObserver: cb});

    cleanup();
    emitData('myObserver', {a: 1}, 'title');

    expect(cb).not.toHaveBeenCalled();
  });
});
