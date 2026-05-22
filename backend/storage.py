"""
Azure Blob Storage utility module.

Falls back to local filesystem when Azure env vars are not set, so existing
deployments continue to work without any configuration change.

Required env vars (all three must be present to enable Azure):
  AZURE_STORAGE_ACCOUNT       — storage account name
  AZURE_STORAGE_KEY           — account key  (or use connection string)
  AZURE_STORAGE_CONTAINER     — container name (default: hns-media)

  OR use a single connection string:
  AZURE_STORAGE_CONNECTION_STRING

Container must have public-read blob access so frontend can load images
directly from the CDN URL.  Certificates use a separate private container
(AZURE_STORAGE_PRIVATE_CONTAINER, default: hns-private).
"""

import os
import uuid
from datetime import datetime

# ── Container names ────────────────────────────────────────────────────────────
PUBLIC_CONTAINER  = os.getenv('AZURE_STORAGE_CONTAINER', 'hns-media')
PRIVATE_CONTAINER = os.getenv('AZURE_STORAGE_PRIVATE_CONTAINER', 'hns-private')

# ── Feature flag ───────────────────────────────────────────────────────────────
def is_enabled() -> bool:
    """Return True if Azure Blob Storage is configured."""
    return bool(
        os.getenv('AZURE_STORAGE_CONNECTION_STRING')
        or (os.getenv('AZURE_STORAGE_ACCOUNT') and os.getenv('AZURE_STORAGE_KEY'))
    )


# ── Internal client factory ────────────────────────────────────────────────────
def _client():
    from azure.storage.blob import BlobServiceClient
    conn_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    if conn_str:
        return BlobServiceClient.from_connection_string(conn_str)
    account = os.getenv('AZURE_STORAGE_ACCOUNT')
    key     = os.getenv('AZURE_STORAGE_KEY')
    return BlobServiceClient(
        account_url=f"https://{account}.blob.core.windows.net",
        credential=key,
    )


def _account_name() -> str:
    conn_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING', '')
    for part in conn_str.split(';'):
        if part.startswith('AccountName='):
            return part.split('=', 1)[1]
    return os.getenv('AZURE_STORAGE_ACCOUNT', '')


def _blob_url(container: str, blob_name: str) -> str:
    return f"https://{_account_name()}.blob.core.windows.net/{container}/{blob_name}"


# ── Blob naming ────────────────────────────────────────────────────────────────
def _make_blob_name(prefix: str, original_filename: str) -> str:
    """
    Build a unique blob path:  prefix/YYYYMMDD_HHMMSS_<uid>.<ext>
    Example: builders/RERA123/logo/20260520_143201_a3f9c2b1.jpg
    """
    ext = ''
    if original_filename and '.' in original_filename:
        ext = '.' + original_filename.rsplit('.', 1)[-1].lower()
    ts  = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    uid = uuid.uuid4().hex[:8]
    return f"{prefix.rstrip('/')}/{ts}_{uid}{ext}"


# ── Public API ─────────────────────────────────────────────────────────────────
def upload_file(file_obj, blob_prefix: str, content_type: str = None,
                private: bool = False) -> str:
    """
    Upload *file_obj* (a Werkzeug FileStorage or file-like object) to Azure.

    Parameters
    ----------
    blob_prefix : str
        Logical folder path, e.g. ``'builders/RERA123/logo'``.
    content_type : str, optional
        MIME type; derived from the file object if omitted.
    private : bool
        Use the private container (for certificates/documents).

    Returns
    -------
    str
        Full public HTTPS URL of the uploaded blob.
    """
    from azure.storage.blob import ContentSettings

    container = PRIVATE_CONTAINER if private else PUBLIC_CONTAINER
    filename  = getattr(file_obj, 'filename', '') or 'upload'
    blob_name = _make_blob_name(blob_prefix, filename)

    ct = content_type or getattr(file_obj, 'content_type', None) or 'application/octet-stream'
    settings = ContentSettings(content_type=ct)

    blob_client = _client().get_blob_client(container=container, blob=blob_name)

    # Reset stream position so the full file is uploaded.
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)

    blob_client.upload_blob(file_obj, overwrite=True, content_settings=settings)
    return _blob_url(container, blob_name)


def delete_file_by_url(url: str) -> None:
    """
    Delete a blob identified by its full URL.
    Silently ignores None, empty strings, and non-Azure URLs.
    """
    if not url or 'blob.core.windows.net' not in url:
        return
    # Determine which container the blob lives in.
    for container in (PUBLIC_CONTAINER, PRIVATE_CONTAINER):
        marker = f'/{container}/'
        if marker in url:
            blob_name = url.split(marker, 1)[1]
            try:
                _client().get_blob_client(container=container, blob=blob_name).delete_blob()
            except Exception as e:
                print(f"[storage] delete_file_by_url failed for {url}: {e}")
            return


def is_blob_url(url: str) -> bool:
    """Return True if *url* is an Azure Blob Storage URL."""
    return bool(url and 'blob.core.windows.net' in url)
