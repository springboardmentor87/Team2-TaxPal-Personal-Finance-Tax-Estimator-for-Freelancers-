const serializeDocument = (document) => {
  if (!document) {
    return null;
  }

  const plain = JSON.parse(JSON.stringify(document));

  if (plain._id) {
    plain.id = plain._id;
    delete plain._id;
  }

  delete plain.__v;

  return plain;
};

const serializeDocuments = (documents = []) => documents.map(serializeDocument);

module.exports = {
  serializeDocument,
  serializeDocuments
};