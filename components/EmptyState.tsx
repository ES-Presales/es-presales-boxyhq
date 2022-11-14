import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const EmptyState = ({
  title,
  description,
  href,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  className?: string;
}) => {
  return (
    <div
      className={`my-3 flex flex-col items-center justify-center space-y-3 rounded border py-32 ${className}`}>
      <InformationCircleIcon className='h-10 w-10' />
      <h4 className='text-center'>{title}</h4>
      {description && <p className='text-center text-gray-500'>{description}</p>}
      {href && (
        <Link href={href} className='btn-primary btn'>
          + Create New
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
