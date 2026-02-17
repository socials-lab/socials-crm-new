import { useParams } from 'react-router-dom';
import { SOPArticleDetail } from '@/components/sop/SOPArticleDetail';

export default function SOPArticle() {
  const { articleId } = useParams();

  if (!articleId) return null;

  return <SOPArticleDetail articleId={articleId} />;
}
