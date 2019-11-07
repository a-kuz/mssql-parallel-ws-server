
USE sup_kkm
DECLARE @bin varbinary(max)

SELECT
    @bin = binarydata
FROM
    [10.1.0.49].sup_kkm.dbo.config
WHERE filename = 'd14dccc4-f67b-4f79-976b-25b257c45cc8.0'

SELECT
    datasize,
    filename,
    len(dbo.config.BinaryData) len

FROM
    sup_kkm.dbo.config
WHERE filename LIKE '%d14dccc4-f67b-4f79-976b-25b257c45cc8%.0' AND @bin <> binarydata
