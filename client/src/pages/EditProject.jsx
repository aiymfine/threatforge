import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '../lib/toast';
import ArchitectureForm from '../components/ArchitectureForm';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Project not found');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      toastError(err.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async ({ name, description, architecture }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, architecture })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update project');
      }
      toastSuccess('Architecture updated');
      navigate(`/project/${id}`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-900 rounded w-64 mb-4" />
          <div className="h-60 bg-gray-900 rounded-xl" />
        </div>
      </div>
    );
  }

  const arch = typeof project.architecture === 'string'
    ? JSON.parse(project.architecture)
    : (project.architecture || {});

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/project/${id}`} className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to project
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Architecture</h1>
        <p className="text-gray-400 text-sm mt-1">Modify components, data flows, and trust boundaries</p>
      </div>

      <ArchitectureForm
        onSubmit={handleSubmit}
        loading={saving}
        initialData={{ name: project.name, description: project.description, architecture: arch }}
        submitLabel="Save Changes"
      />
    </div>
  );
}
