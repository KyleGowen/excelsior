import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '../components/Pagination/Pagination';

const meta = {
  title: 'Controls/Pagination',
  component: Pagination,
  args: { page: 1, pageSize: 24, totalItems: 284, onPageChange: () => {} },
  render: (args) => {
    const [page, setPage] = useState(args.page);
    return <Pagination {...args} page={page} onPageChange={setPage} />;
  },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {};
export const MiddlePage: Story = { args: { page: 6 } };
export const Empty: Story = { args: { totalItems: 0 } };
