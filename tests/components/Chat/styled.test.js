import styled from 'components/Chat/styled';

jest.mock('styled-components', () => ({
  __esModule: true,
  default: {
    div: (() => {
      const divMock = jest.fn((strings, ...values) => ({
        template: `${strings.join('')}${values.join('')}`,
      }));
      divMock.withConfig = () => divMock;
      return divMock;
    })(),
  },
}));

describe('components/Chat/styled', () => {
  it('requires css by component name and returns styled component', () => {
    const component = styled('MessageList');

    expect(component).toHaveProperty('template');
    expect(component.template).toContain('CSS_MODULE');
  });
});
