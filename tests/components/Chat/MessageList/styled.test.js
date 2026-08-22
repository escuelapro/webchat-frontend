const mockDiv = jest.fn((strings, ...values) => ({
  template: `${strings.join('')}${values.join('')}`,
}));
mockDiv.withConfig = () => mockDiv;

jest.mock('styled-components', () => ({
  __esModule: true,
  default: {
    div: mockDiv,
  },
}));

const styled = require('components/Chat/MessageList/styled').default;

describe('components/Chat/MessageList/styled', () => {
  it('requires the css file by name and returns a styled component', () => {
    const component = styled('MessageList');

    expect(component).toHaveProperty('template');
    expect(component.template).toContain('CSS_MODULE');
  });
});
