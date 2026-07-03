import React from 'react';
import { render } from '@testing-library/react-native';
import Skeleton, { SkeletonLine } from '../Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Skeleton width={100} height={20} />);
    expect(toJSON()).toBeTruthy();
  });

  it('applies the provided width and height', () => {
    const { toJSON } = render(<Skeleton width={120} height={40} />);
    const tree = toJSON();
    const style = Array.isArray(tree.props.style)
      ? Object.assign({}, ...tree.props.style)
      : tree.props.style;
    expect(style.width).toBe(120);
    expect(style.height).toBe(40);
  });

  it('SkeletonLine renders with default props', () => {
    const { toJSON } = render(<SkeletonLine />);
    expect(toJSON()).toBeTruthy();
  });
});
