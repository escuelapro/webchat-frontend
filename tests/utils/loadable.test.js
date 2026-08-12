import React from 'react';
import renderer, {act} from 'react-test-renderer';

import loadable from 'utils/loadable';

describe('loadable', () => {
  it('renders fallback while lazy component is unresolved', () => {
    const importFunc = () => new Promise(() => {});

    const Wrapped = loadable(importFunc, {
      fallback: <div test-id="fallback" />,
    });

    let tree;
    act(() => {
      tree = renderer.create(<Wrapped />);
    });

    const node = tree.toJSON();
    expect(JSON.stringify(node)).toContain('fallback');
  });

  it('renders lazy component when import resolves', async () => {
    let resolveImport;
    const importPromise = new Promise(resolve => {
      resolveImport = resolve;
    });
    const importFunc = () => importPromise;
    const Wrapped = loadable(importFunc, {
      fallback: <div test-id="fallback" />,
    });

    let tree;
    act(() => {
      tree = renderer.create(<Wrapped />);
    });

    expect(JSON.stringify(tree.toJSON())).toContain('fallback');

    act(() => {
      resolveImport({
        default: () => <div test-id="loaded">ok</div>,
      });
    });

    // Flush promise microtasks & React updates.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(JSON.stringify(tree.toJSON())).toContain('loaded');
  });

  it('renders null fallback by default when fallback is not provided', () => {
    const importFunc = () => new Promise(() => {});

    const Wrapped = loadable(importFunc);

    let tree;
    act(() => {
      tree = renderer.create(<Wrapped />);
    });

    expect(tree.toJSON()).toBeNull();
  });
});
