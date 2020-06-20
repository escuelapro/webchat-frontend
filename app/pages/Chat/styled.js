import styled from 'styled-components';

export default name => {
  const styles = require(`./${name}.css`).toString();
  return styled.div`
  ${styles}
  `;
}
