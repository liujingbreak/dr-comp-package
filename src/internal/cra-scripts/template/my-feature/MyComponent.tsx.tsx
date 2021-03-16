import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames/bind';
import styles from './$__MyComponent__$.module.scss';

const cx = classnames.bind(styles);

const imgCls = cx('assets');
const textCls = cx('red');

export type $__MyComponent__$Props = React.PropsWithChildren<{
}>;

const $__MyComponent__$: React.FC<$__MyComponent__$Props> = function(props) {
  return <>
    <div className={imgCls}></div>
    <div className={textCls}>You component goes here</div>
    </>;
};

export default $__MyComponent__$;

/**
 * Export a render method if build as a library
 * @param dom 
 */
export function renderDom(dom: HTMLElement) {
  ReactDOM.render(<$__MyComponent__$/>, dom);

  return {
    unmount() {
      ReactDOM.unmountComponentAtNode(dom);
    }
  };
}
