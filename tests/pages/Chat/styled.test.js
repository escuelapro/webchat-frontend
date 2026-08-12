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

const styled = require('pages/Chat/styled').default;

describe('pages/Chat/styled', () => {
  it('requires the css file by name and returns a styled component', () => {
    const component = styled('Page');

    expect(component).toHaveProperty('template');
    expect(component.template).toContain('CSS_MODULE');
  });
});
